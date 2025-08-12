import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TenantService } from '../../common/tenant/tenant.service';
import { TelegramService } from '../../common/notifications/telegram.service';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tenantService: TenantService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Validar usuário para estratégia local
   */
  async validateUser(email: string, password: string, clientId?: string) {
    try {
      // Primeira tentativa: buscar usuário com clientId (se fornecido)
      let user = await this.prisma.user.findFirst({
        where: {
          email,
          ...(clientId && { clientId }),
          status: 'ACTIVE',
        },
        select: {
          id: true,
          clientId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          emailVerified: true,
          emailVerifiedAt: true,
          employeeId: true, // <-- garante no JSON
          lockedUntil: true,
          password: true,
          failedLoginAttempts: true,
        },
      });

      // Se não encontrou usuário e há clientId, tentar buscar SUPER_ADMIN sem filtro de clientId
      if (!user && clientId) {
        user = await this.prisma.user.findFirst({
          where: {
            email,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
          },
          include: {
            client: {
              select: { id: true, name: true, status: true },
            },
            employees: {
              select: { id: true, isActive: true },
            },
          },
        });
      }

      if (!user) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '🔐 TENTATIVA DE LOGIN FALHOU',
          `Tentativa de login com email inexistente: ${email}`,
          { email, clientId, timestamp: new Date() },
        );
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar se a conta não está bloqueada
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '🔒 CONTA BLOQUEADA',
          `Tentativa de login em conta bloqueada: ${email}`,
          { email, userId: user.id, clientId, lockedUntil: user.lockedUntil },
        );
        throw new UnauthorizedException('Conta temporariamente bloqueada');
      }

      console.log('[AUTH] Senha recebida:', password);
      console.log('[AUTH] Senha no banco:', user.password);

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.id);
        await this.telegramService.sendCustomAlert(
          'warning',
          '🔐 SENHA INCORRETA',
          `Tentativa de login com senha incorreta: ${email}`,
          { email, userId: user.id, clientId, timestamp: new Date() },
        );
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Resetar tentativas de login falhadas
      await this.resetFailedLoginAttempts(user.id);

      // Atualizar último login
      await this.updateLastLogin(user.id);

      // Notificar login bem-sucedido para usuários importantes
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'EMPLOYEE') {
        await this.telegramService.sendCustomAlert(
          'success',
          '✅ LOGIN ADMIN REALIZADO',
          `Login bem-sucedido de administrador: ${email}`,
          { email, userId: user.id, role: user.role, clientId, timestamp: new Date() },
        );
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // Se não for UnauthorizedException, notificar erro crítico
      if (!(error instanceof UnauthorizedException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO CRÍTICO NO AUTH',
          `Erro durante validação de usuário: ${error.message}`,
          { email, clientId, error: error.stack, timestamp: new Date() },
        );
      }
      throw error;
    }
  }

  /**
   * Registrar novo usuário
   */
  async register(registerDto: RegisterDto, clientId: string) {
    try {
      // Verificar se o cliente existe
      const clientExists = await this.tenantService.validateClient(clientId);
      if (!clientExists) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 CLIENTE INVÁLIDO',
          `Tentativa de registro com clientId inválido: ${clientId}`,
          { clientId, email: registerDto.email, timestamp: new Date() },
        );
        throw new BadRequestException('Cliente inválido');
      }

      // Verificar se email já existe para este cliente
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: registerDto.email,
          clientId,
        },
      });

      if (existingUser) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '⚠️ EMAIL JÁ CADASTRADO',
          `Tentativa de registro com email existente: ${registerDto.email}`,
          { email: registerDto.email, clientId, timestamp: new Date() },
        );
        throw new ConflictException('Email já cadastrado');
      }

      // Hash da senha
      const hashedPassword = await this.hashPassword(registerDto.password);

      // Criar usuário
      const user = await this.prisma.user.create({
        data: {
          ...registerDto,
          password: hashedPassword,
          clientId,
          role: registerDto.role || 'CLIENT',
        },
        include: {
          client: {
            select: { id: true, name: true, status: true },
          },
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      // Gerar tokens após registro bem-sucedido
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Notificar registro bem-sucedido
      await this.telegramService.sendCustomAlert(
        'success',
        '✅ NOVO USUÁRIO REGISTRADO',
        `Novo usuário registrado: ${user.email} (${user.role})`,
        { email: user.email, role: user.role, clientId, userId: user.id, timestamp: new Date() },
      );

      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          token: accessToken,
          client_id: user.clientId,
          user: userWithoutPassword,
          refresh_token: refreshToken,
          expires_in: this.configService.get('JWT_EXPIRATION'),
        },
      };
    } catch (error) {
      // Se não for BadRequestException ou ConflictException, notificar erro crítico
      if (!(error instanceof BadRequestException) && !(error instanceof ConflictException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO NO REGISTRO',
          `Erro durante registro de usuário: ${error.message}`,
          { email: registerDto.email, clientId, error: error.stack, timestamp: new Date() },
        );
      }
      throw error;
    }
  }

  /**
   * Login do usuário
   */
  async login(loginDto: LoginDto, clientId?: string): Promise<any> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password, clientId);

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token: accessToken,
          client_id: user.clientId,
          user: user,
          refresh_token: refreshToken,
          expires_in: this.configService.get('JWT_EXPIRATION'),
        },
      };
    } catch (error) {
      // Erro já tratado no validateUser
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            client: {
              select: { id: true, name: true, status: true },
            },
            employees: {
              select: { id: true, isActive: true },
            },
          },
        },
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Verificar se usuário ainda está ativo
    if (tokenRecord.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo');
    }

    const payload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      clientId: tokenRecord.user.clientId,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.user.id);

    // Remover o refresh token antigo
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    const { password: _, ...userWithoutPassword } = tokenRecord.user;

    return {
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newAccessToken,
        client_id: userWithoutPassword.clientId,
        user: userWithoutPassword,
        refresh_token: newRefreshToken,
        expires_in: this.configService.get('JWT_EXPIRATION'),
      },
    };
  }

  /**
   * Logout do usuário
   */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Obter perfil do usuário autenticado
   */
  async getProfile(user: any) {
    // LOG para debug
    console.log('[getProfile] Usuário recebido:', user);
    // O user já vem da estratégia JWT com todos os dados necessários
    // Apenas remover a senha se estiver presente e retornar
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS')) || 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Gerar refresh token
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Lidar com falha de login
   */
  private async handleFailedLogin(userId: string) {
    const maxAttempts = parseInt(this.configService.get('MAX_LOGIN_ATTEMPTS')) || 5;
    const lockoutTime = parseInt(this.configService.get('LOCKOUT_TIME')) || 900000; // 15 min

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const newAttempts = (user?.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= maxAttempts;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        ...(shouldLock && {
          lockedUntil: new Date(Date.now() + lockoutTime),
        }),
      },
    });
  }

  /**
   * Resetar tentativas de login falhadas
   */
  private async resetFailedLoginAttempts(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Atualizar último login
   */
  private async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  // ... existing code ...

  async updateCredentials(userId: string, updateCredentialsDto: UpdateCredentialsDto) {
    this.logger.log(`updateCredentials iniciado para usuário: ${userId}`);

    const { email, password } = updateCredentialsDto;
    this.logger.log(`Novo email: ${email}`);

    try {
      // Verificar se o email já está em uso por outro usuário
      this.logger.log(`Verificando se email já está em uso`);
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        this.logger.error(`Email já está em uso: ${email}`);

        // Enviar notificação de falha para funcionários
        this.logger.log(`🔔 [Telegram] ===== INÍCIO DO PROCESSO DE NOTIFICAÇÃO DE FALHA =====`);
        this.logger.log(`🔔 [Telegram] Email já está em uso, enviando notificação de falha...`);

        try {
          await this.sendUpdateCredentialsFailureNotification(userId, 'Email já está em uso', {
            email,
          });
          this.logger.log(`🔔 [Telegram] Notificação de falha enviada com sucesso`);
        } catch (notificationError) {
          this.logger.error('Erro ao enviar notificação de falha:', notificationError);
        }

        this.logger.log(`🔔 [Telegram] Lançando exceção: Email já está em uso`);
        throw new BadRequestException('Email já está em uso');
      }

      this.logger.log(`Email disponível, fazendo hash da senha`);
      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Atualizar usuário
      this.logger.log(`Atualizando usuário no banco`);
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: email,
          password: hashedPassword,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = updatedUser;

      this.logger.log(`Credenciais atualizadas com sucesso para usuário: ${userId}`);

      // Enviar notificação do Telegram para funcionários
      this.logger.log(`🔔 [Telegram] ===== INÍCIO DO PROCESSO DE NOTIFICAÇÃO =====`);
      this.logger.log(`🔔 [Telegram] Iniciando processo de notificação para usuário: ${userId}`);

      try {
        this.logger.log(
          `🔔 [Telegram] Tentando enviar notificação de sucesso para usuário: ${userId}`,
        );

        this.logger.log(`🔔 [Telegram] Buscando usuário no banco de dados...`);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { client: true },
        });

        this.logger.log(`🔔 [Telegram] Usuário encontrado: ${user ? 'SIM' : 'NÃO'}`);
        this.logger.log(`🔔 [Telegram] Role do usuário: ${user?.role}`);

        if (user && user.role === 'EMPLOYEE') {
          this.logger.log(
            `🔔 [Telegram] Enviando notificação de sucesso para funcionário: ${user.name}`,
          );

          this.logger.log(`🔔 [Telegram] Chamando telegramService.sendCustomAlert...`);
          await this.telegramService.sendCustomAlert(
            'success',
            '🔐 CREDENCIAIS ATUALIZADAS',
            `Funcionário atualizou suas credenciais de acesso`,
            {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              clientName: user.client?.name || 'N/A',
              clientId: user.clientId,
              timestamp: new Date(),
              action: 'update_credentials',
            },
          );

          this.logger.log(`🔔 [Telegram] Notificação de sucesso enviada com sucesso`);
        } else {
          this.logger.log(`🔔 [Telegram] Usuário não é funcionário ou não encontrado`);
        }
      } catch (error) {
        this.logger.error('Erro ao enviar notificação do Telegram:', error);
        this.logger.error('Stack trace:', error.stack);
        // Não falhar a operação se a notificação falhar
      }

      return {
        success: true,
        message: 'Credenciais atualizadas com sucesso',
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar credenciais para usuário ${userId}:`, error);

      // Enviar notificação de falha para funcionários
      await this.sendUpdateCredentialsFailureNotification(userId, error.message, {
        email,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Enviar notificação de falha na atualização de credenciais
   */
  private async sendUpdateCredentialsFailureNotification(
    userId: string,
    errorMessage: string,
    details?: any,
  ) {
    this.logger.log(
      `🔔 [Telegram] Iniciando processo de notificação de falha para usuário: ${userId}`,
    );

    try {
      this.logger.log(`🔔 [Telegram] Tentando enviar notificação de falha para usuário: ${userId}`);

      this.logger.log(`🔔 [Telegram] Buscando usuário no banco de dados...`);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { client: true },
      });

      this.logger.log(`🔔 [Telegram] Usuário encontrado: ${user ? 'SIM' : 'NÃO'}`);
      this.logger.log(`🔔 [Telegram] Role do usuário: ${user?.role}`);

      if (user && user.role === 'EMPLOYEE') {
        this.logger.log(`🔔 [Telegram] Enviando notificação para funcionário: ${user.name}`);

        this.logger.log(`🔔 [Telegram] Chamando telegramService.sendCustomAlert...`);
        await this.telegramService.sendCustomAlert(
          'error',
          '❌ FALHA NA ATUALIZAÇÃO DE CREDENCIAIS',
          `Erro ao atualizar credenciais do funcionário`,
          {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            clientName: user.client?.name || 'N/A',
            clientId: user.clientId,
            errorMessage,
            timestamp: new Date(),
            action: 'update_credentials_failed',
            ...details,
          },
        );

        this.logger.log(`🔔 [Telegram] Notificação enviada com sucesso`);
      } else {
        this.logger.log(`🔔 [Telegram] Usuário não é funcionário ou não encontrado`);
      }
    } catch (notificationError) {
      this.logger.error('Erro ao enviar notificação de falha do Telegram:', notificationError);
      this.logger.error('Stack trace:', notificationError.stack);
      // Não falhar a operação se a notificação falhar
    }
  }

  // ... existing code ...
}
