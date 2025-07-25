import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@Controller('notifications/telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('test')
  async testConnection() {
    const success = await this.telegramService.testConnection();
    return {
      success,
      message: success ? 'Telegram connection test successful' : 'Telegram connection test failed',
    };
  }

  @Post('alert')
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
  async getStatus() {
    const isEnabled = await this.telegramService.testConnection();
    return {
      enabled: isEnabled,
      timestamp: new Date().toISOString(),
    };
  }
}
