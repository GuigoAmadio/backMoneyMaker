import { Controller, Post, Body, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram Notifications')
@Controller('notifications/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  // Endpoints públicos (sem autenticação) - COM RATE LIMITING
  @Get('public/test')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Testar conexão com Telegram (Público)' })
  @ApiResponse({ status: 200, description: 'Resultado do teste de conexão' })
  async testTelegramPublic(): Promise<object> {
    return await this.telegramService.testTelegramConnection();
  }

  @Post('public/test-message')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Enviar mensagem de teste para Telegram (Público)' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  async sendTestMessagePublic(@Body() body: { message: string }): Promise<object> {
    // Validação adicional para endpoints públicos
    if (!body.message || body.message.length > 1000) {
      throw new BadRequestException('Mensagem inválida: deve ter entre 1 e 1000 caracteres');
    }

    return await this.telegramService.sendTestMessage(body.message || 'Mensagem de teste padrão');
  }

  @Get('public/status')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Status do Telegram (Público)' })
  @ApiResponse({ status: 200, description: 'Status do serviço Telegram' })
  async getTelegramStatusPublic(): Promise<object> {
    const result = await this.telegramService.testTelegramConnection();
    return {
      enabled: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('public/bot-info')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Informações do bot (Público)' })
  @ApiResponse({ status: 200, description: 'Informações do bot Telegram' })
  async getBotInfoPublic(): Promise<object> {
    return await this.telegramService.getChatInfo();
  }

  @Get('public/health')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: 'Health check do Telegram (Público)' })
  @ApiResponse({ status: 200, description: 'Status de saúde do serviço Telegram' })
  async getHealthPublic(): Promise<object> {
    return await this.telegramService.healthCheck();
  }

  // Endpoints privados (com autenticação)
  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Testar conexão com Telegram (Autenticado)' })
  async testConnection() {
    return await this.telegramService.testTelegramConnection();
  }

  @Post('test-message')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar mensagem de teste (Autenticado)' })
  async sendTestMessage(@Body() body: { message: string }) {
    return await this.telegramService.sendTestMessage(body.message || 'Mensagem de teste padrão');
  }

  @Get('bot-info')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Informações do bot (Autenticado)' })
  async getBotInfo() {
    return await this.telegramService.getChatInfo();
  }

  @Get('updates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter atualizações do bot' })
  async getUpdates() {
    return await this.telegramService.getUpdates();
  }

  @Post('alert')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar alerta customizado' })
  async sendCustomAlert(
    @Body()
    data: {
      type: 'error' | 'warning' | 'info' | 'success';
      title: string;
      message: string;
      details?: any;
    },
  ) {
    await this.telegramService.sendCustomAlert(data.type, data.title, data.message, data.details);
    return { success: true, message: 'Alert sent successfully' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Status do Telegram (Autenticado)' })
  async getStatus() {
    const result = await this.telegramService.testTelegramConnection();
    return {
      enabled: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Health check detalhado do Telegram (Autenticado)' })
  @ApiResponse({ status: 200, description: 'Status de saúde detalhado do serviço Telegram' })
  async getHealth() {
    return await this.telegramService.healthCheck();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Métricas do Telegram (Autenticado)' })
  @ApiResponse({ status: 200, description: 'Métricas detalhadas do serviço Telegram' })
  async getMetrics() {
    return await this.telegramService.getMetrics();
  }

  @Post('reset-metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resetar métricas do Telegram (Autenticado)' })
  @ApiResponse({ status: 200, description: 'Métricas resetadas com sucesso' })
  async resetMetrics() {
    this.telegramService.resetMetrics();
    return { success: true, message: 'Métricas resetadas com sucesso' };
  }
}
