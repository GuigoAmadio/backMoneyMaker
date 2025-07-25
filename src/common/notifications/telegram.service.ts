import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { QueueService } from '../queue/queue.service';

export interface TelegramAlert {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp?: Date;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private chatId: string;
  private isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    @Optional() private readonly queueService?: QueueService,
  ) {
    this.initializeBot();
  }

  private initializeBot() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    this.isEnabled = this.configService.get<boolean>('TELEGRAM_ENABLED', true);

    if (!token || !this.chatId) {
      this.logger.warn('Telegram bot not configured. Notifications disabled.');
      this.isEnabled = false;
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      this.logger.log('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
      this.isEnabled = false;
    }
  }

  async sendAlert(alert: TelegramAlert): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      this.logger.debug('Telegram notifications disabled');
      return;
    }

    try {
      const message = this.formatMessage(alert);
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      this.logger.log(`Telegram alert sent: ${alert.type} - ${alert.title}`);
    } catch (error) {
      this.logger.error('Failed to send Telegram alert:', error);
    }
  }

  private formatMessage(alert: TelegramAlert): string {
    const timestamp = alert.timestamp || new Date();
    const emoji = this.getEmoji(alert.type);
    const status = this.getStatusText(alert.type);

    let message = `${emoji} <b>${alert.title}</b>\n`;
    message += `📅 <b>Data:</b> ${timestamp.toLocaleString('pt-BR')}\n`;
    message += `🔔 <b>Status:</b> ${status}\n\n`;
    message += `${alert.message}\n`;

    if (alert.details) {
      message += `\n📋 <b>Detalhes:</b>\n`;
      message += `<code>${JSON.stringify(alert.details, null, 2)}</code>`;
    }

    return message;
  }

  private getEmoji(type: string): string {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '📢';
    }
  }

  private getStatusText(type: string): string {
    switch (type) {
      case 'error':
        return 'ERRO CRÍTICO';
      case 'warning':
        return 'ATENÇÃO';
      case 'info':
        return 'INFORMAÇÃO';
      case 'success':
        return 'SUCESSO';
      default:
        return 'NOTIFICAÇÃO';
    }
  }

  // Alertas específicos para diferentes situações
  async sendServerDownAlert(details?: any): Promise<void> {
    await this.sendAlert({
      type: 'error',
      title: '🚨 SERVIDOR CAIU',
      message: 'O servidor Money Maker está offline ou não está respondendo.',
      details,
    });
  }

  async sendHighErrorRateAlert(errorRate: number, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'warning',
      title: '⚠️ ALTA TAXA DE ERRO',
      message: `Taxa de erro elevada detectada: ${errorRate.toFixed(2)}%`,
      details,
    });
  }

  async sendSlowResponseAlert(responseTime: number, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'warning',
      title: '🐌 RESPOSTA LENTA',
      message: `Tempo de resposta muito alto: ${responseTime}ms`,
      details,
    });
  }

  async sendDatabaseErrorAlert(error: string, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'error',
      title: '🗄️ ERRO NO BANCO',
      message: `Erro na conexão com o banco de dados: ${error}`,
      details,
    });
  }

  async sendRedisErrorAlert(error: string, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'error',
      title: '🔴 ERRO NO REDIS',
      message: `Erro na conexão com Redis: ${error}`,
      details,
    });
  }

  async sendMemoryUsageAlert(usage: number, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'warning',
      title: '💾 ALTO USO DE MEMÓRIA',
      message: `Uso de memória elevado: ${usage.toFixed(1)}%`,
      details,
    });
  }

  async sendDiskSpaceAlert(usage: number, details?: any): Promise<void> {
    await this.sendAlert({
      type: 'warning',
      title: '💿 ESPAÇO EM DISCO',
      message: `Espaço em disco baixo: ${usage.toFixed(1)}%`,
      details,
    });
  }

  async sendCustomAlert(
    type: string,
    title: string,
    message: string,
    details?: any,
  ): Promise<void> {
    await this.sendAlert({
      type: type as any,
      title,
      message,
      details,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      return false;
    }

    try {
      await this.bot.sendMessage(
        this.chatId,
        '�� Teste de conexão - Money Maker Monitor está funcionando!',
        {
          parse_mode: 'HTML',
        },
      );
      return true;
    } catch (error) {
      this.logger.error('Telegram connection test failed:', error);
      return false;
    }
  }

  async sendTelegramViaQueue(chatId: string, message: string) {
    if (!this.queueService) {
      this.logger.warn('QueueService not available, sending directly');
      await this.sendCustomAlert('info', 'Notificação', message);
      return;
    }

    await this.queueService.addJob({
      tipo: 'telegram',
      payload: { chatId, message },
    });
  }
}
