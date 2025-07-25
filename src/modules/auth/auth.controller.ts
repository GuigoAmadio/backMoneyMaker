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

@ApiTags('Autenticação')
@Controller({ path: 'auth', version: '1' })
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente',
    required: true,
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
  async register(@Body() registerDto: RegisterDto, @Tenant() clientId: string) {
    this.logger.log(
      `Tentativa de registro para clientId: ${clientId}, email: ${registerDto.email}`,
    );
    try {
      const result = await this.authService.register(registerDto, clientId);
      this.logger.log(`Registro realizado com sucesso para email: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro no registro para email: ${registerDto.email}`, error);
      throw error;
    }
  }

  @Public()
  @Post('login')
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
  async login(@Body() loginDto: LoginDto, @Tenant() clientId: string): Promise<LoginResponseDto> {
    this.logger.log(`Tentativa de login para clientId: ${clientId}, email: ${loginDto.email}`);
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
  async getProfile(@Req() req: Request) {
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
}
