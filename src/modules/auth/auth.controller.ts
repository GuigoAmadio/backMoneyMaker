import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  Logger,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { TelegramService } from '../../common/notifications/telegram.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Autenticação')
@Controller({ path: 'auth', version: '1' })
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private telegramService: TelegramService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registros por minuto
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente (opcional - se não fornecido, cria novo cliente)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já cadastrado',
  })
  async register(@Body() registerDto: RegisterDto, @Req() request: Request) {
    // Extrair x-client-id do header manualmente (não usar @Tenant decorator)
    const providedClientId = request.headers['x-client-id'] as string;

    // Cenário 1: SEM x-client-id → criar novo cliente
    // Cenário 2: COM x-client-id → adicionar user ao cliente existente
    const finalClientId = providedClientId || undefined; // deixar undefined para auth.service criar

    this.logger.log(
      `Tentativa de registro - Email: ${registerDto.email}, ClientId fornecido: ${providedClientId || 'NÃO'}, Novo Cliente: ${!providedClientId}`,
    );

    try {
      const result = await this.authService.register(registerDto, finalClientId);
      this.logger.log(`Registro realizado com sucesso para email: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro no registro para email: ${registerDto.email}`, error);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentativas por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realizar login' })
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente (opcional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request): Promise<LoginResponseDto> {
    // Extrair x-client-id do header (opcional para login)
    const clientId = request.headers['x-client-id'] as string;

    this.logger.log(
      `Tentativa de login - Email: ${loginDto.email}, ClientId: ${clientId || 'NÃO FORNECIDO'}`,
    );

    try {
      const result = await this.authService.login(loginDto, clientId);
      this.logger.log(`Login realizado com sucesso para email: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro no login para email: ${loginDto.email}`, error);
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obter informações do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Informações do usuário',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getProfile(@Req() req: any) {
    const userId = (req.user as any)?.id || 'unknown';
    this.logger.log(`Perfil solicitado para usuário: ${userId}`);
    try {
      const result = await this.authService.getProfile(req.user);
      this.logger.log(`Perfil obtido com sucesso para usuário: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter perfil para usuário: ${userId}`, error);
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Alias para /me - Obter informações do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Informações do usuário',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getProfileAlias(@Req() req: any) {
    // Redirecionar para o método getProfile
    return this.getProfile(req);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Realizar logout' })
  @ApiResponse({
    status: 204,
    description: 'Logout realizado com sucesso',
  })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Public()
  @Get('test-telegram')
  @ApiOperation({ summary: 'Testar notificação do Telegram' })
  @ApiResponse({
    status: 200,
    description: 'Teste do Telegram realizado',
  })
  async testTelegram() {
    this.logger.log('Testando notificação do Telegram...');
    try {
      await this.telegramService.sendCustomAlert(
        'info',
        '🧪 TESTE DE NOTIFICAÇÃO',
        'Teste de notificação do Telegram para atualização de credenciais',
        {
          test: true,
          timestamp: new Date(),
          source: 'auth_controller',
        },
      );
      this.logger.log('Teste do Telegram realizado com sucesso');
      return { success: true, message: 'Notificação do Telegram enviada com sucesso' };
    } catch (error) {
      this.logger.error('Erro no teste do Telegram:', error);
      return { success: false, message: `Erro: ${error.message}` };
    }
  }

  @Put('update-credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualizar credenciais do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Credenciais atualizadas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async updateCredentials(
    @Req() req: any,
    @Body() updateCredentialsDto: UpdateCredentialsDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`updateCredentials iniciado`);
    this.logger.log(`Usuário: ${req.user.id} (${req.user.email})`);
    this.logger.log(`Role: ${req.user.role}`);
    this.logger.log(`ClientId: ${clientId}`);
    this.logger.log(`Dados recebidos: ${JSON.stringify(updateCredentialsDto)}`);

    const result = await this.authService.updateCredentials(req.user.id, updateCredentialsDto);

    this.logger.log(`updateCredentials concluído com sucesso`);
    return result;
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentativas por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente (opcional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado (se existir)',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Req() request: Request) {
    const clientId = request.headers['x-client-id'] as string;
    this.logger.log(`Solicitação de recuperação de senha para: ${forgotPasswordDto.email}`);

    return this.authService.forgotPassword(forgotPasswordDto, clientId);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Tentativa de redefinição de senha');
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar email com token' })
  @ApiResponse({
    status: 200,
    description: 'Email verificado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    this.logger.log('Tentativa de verificação de email');
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar email de verificação' })
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente (opcional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Email de verificação reenviado (se existir)',
  })
  async resendVerification(@Body() body: { email: string }, @Req() request: Request) {
    const clientId = request.headers['x-client-id'] as string;
    this.logger.log(`Reenvio de email de verificação para: ${body.email}`);

    return this.authService.resendVerificationEmail(body.email, clientId);
  }
}
