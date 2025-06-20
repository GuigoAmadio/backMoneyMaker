import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TenantService } from '../../common/tenant/tenant.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tenantService: TenantService,
  ) {}

  /**
   * Validar usuário para estratégia local
   */
  async validateUser(email: string, password: string, clientId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(clientId && { clientId }),
        status: 'ACTIVE',
      },
      include: {
        client: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se a conta não está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Resetar tentativas de login falhadas
    await this.resetFailedLoginAttempts(user.id);

    // Atualizar último login
    await this.updateLastLogin(user.id);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Registrar novo usuário
   */
  async register(registerDto: RegisterDto, clientId: string) {
    // Verificar se o cliente existe
    const clientExists = await this.tenantService.validateClient(clientId);
    if (!clientExists) {
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
    return userWithoutPassword;
  }

  /**
   * Login do usuário
   */
  async login(loginDto: LoginDto, clientId?: string): Promise<any> {
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
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        client: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!fullUser) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const { password: _, ...userWithoutPassword } = fullUser;
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
}
