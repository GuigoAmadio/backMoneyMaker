import { Controller, Get, Post, Put, Body, UseGuards, Req, Logger, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    clientId: string;
  };
  clientId?: string;
}

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações do aplicativo' })
  async getAppSettings(@Req() req: AuthenticatedRequest) {
    this.logger.log(`⚙️ [Settings] Buscando configurações para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;

    if (!clientId) {
      throw new Error('Cliente não identificado');
    }

    const settings = await this.settingsService.getAppSettings(clientId);

    return {
      success: true,
      data: settings,
    };
  }

  @Get('user')
  @ApiOperation({ summary: 'Obter configurações do usuário' })
  async getUserSettings(@Req() req: AuthenticatedRequest) {
    this.logger.log(`👤 [Settings] Buscando configurações de usuário para: ${req.user?.email}`);

    const userId = req.user?.sub;
    const clientId = req.user?.clientId || req.clientId;

    const settings = await this.settingsService.getUserSettings(userId, clientId);

    return {
      success: true,
      data: settings,
    };
  }

  @Put('user')
  @ApiOperation({ summary: 'Atualizar configurações do usuário' })
  async updateUserSettings(@Req() req: AuthenticatedRequest, @Body() updateData: any) {
    this.logger.log(`📝 [Settings] Atualizando configurações de usuário para: ${req.user?.email}`);

    const userId = req.user?.sub;
    const clientId = req.user?.clientId || req.clientId;

    const settings = await this.settingsService.updateUserSettings(userId, clientId, updateData);

    return {
      success: true,
      data: settings,
      message: 'Configurações atualizadas com sucesso',
    };
  }

  @Get('client')
  @ApiOperation({ summary: 'Obter configurações do cliente/empresa' })
  async getClientSettings(@Req() req: AuthenticatedRequest) {
    this.logger.log(`🏢 [Settings] Buscando configurações de cliente para: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;

    const settings = await this.settingsService.getClientSettings(clientId);

    return {
      success: true,
      data: settings,
    };
  }

  @Put('client')
  @ApiOperation({ summary: 'Atualizar configurações do cliente/empresa' })
  async updateClientSettings(@Req() req: AuthenticatedRequest, @Body() updateData: any) {
    this.logger.log(`📝 [Settings] Atualizando configurações de cliente para: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    // Verificar se usuário tem permissão
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      throw new Error('Permissão negada para alterar configurações do cliente');
    }

    const settings = await this.settingsService.updateClientSettings(clientId, updateData);

    return {
      success: true,
      data: settings,
      message: 'Configurações do cliente atualizadas com sucesso',
    };
  }
}
