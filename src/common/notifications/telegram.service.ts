import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TelegramBot = require('node-telegram-bot-api');

export interface TelegramAlert {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: any;
  timestamp?: Date;
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: any;
  private chatId: string;
  private isEnabled: boolean;
  private startTime: number;

  // Rate limiting e circuit breaker
  private messageQueue: Array<{ timestamp: number; message: string }> = [];
  private readonly MAX_MESSAGES_PER_MINUTE = 20;
  private readonly MIN_INTERVAL_BETWEEN_MESSAGES = 1000; // 1 segundo
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private consecutiveFailures = 0;
  private circuitBreakerOpen = false;
  private lastError: any = null;

  // Métricas
  private metrics = {
    messagesSent: 0,
    errors: 0,
    rateLimitHits: 0,
    userBlocked: 0,
    lastMessageTime: 0,
    averageResponseTime: 0,
    consecutiveFailures: 0,
    totalResponseTime: 0,
  };

  constructor(private configService: ConfigService) {
    this.logger.log('TelegramService: Inicializando...');
    this.startTime = Date.now();
    // Inicialização assíncrona movida para onModuleInit
  }

  async onModuleInit() {
    try {
      await this.initializeBot();
    } catch (error) {
      this.logger.error('Erro na inicialização do TelegramService:', error);
      this.isEnabled = false;
    }
  }

  private async initializeBot(): Promise<boolean> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    this.logger.log(`TelegramService: Token configurado: ${token ? 'SIM' : 'NÃO'}`);
    this.logger.log(`TelegramService: Chat ID configurado: ${chatId ? 'SIM' : 'NÃO'}`);

    if (!token || !chatId) {
      this.logger.warn('Telegram bot not configured. Notifications disabled.');
      this.isEnabled = false;
      return false;
    }

    try {
      // Validar token
      const tempBot = new (TelegramBot as any)(token, {
        polling: false,
        webHook: false,
      });

      const me = await tempBot.getMe();

      // Validar chat ID
      await tempBot.sendChatAction(chatId, 'typing');

      this.bot = tempBot;
      this.chatId = chatId;
      this.isEnabled = true;

      this.logger.log(`Telegram: Bot ${me.first_name} (@${me.username}) inicializado com sucesso`);
      return true;
    } catch (error) {
      this.logger.error('Telegram: Falha na inicialização:', error);
      this.isEnabled = false;
      this.lastError = error;
      return false;
    }
  }

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();

    // Limpar mensagens antigas (mais de 1 minuto)
    this.messageQueue = this.messageQueue.filter((msg) => now - msg.timestamp < 60000);

    // Verificar limite de mensagens por minuto
    if (this.messageQueue.length >= this.MAX_MESSAGES_PER_MINUTE) {
      this.logger.warn('Telegram: Rate limit atingido');
      this.metrics.rateLimitHits++;
      return false;
    }

    // Verificar intervalo mínimo entre mensagens
    const lastMessage = this.messageQueue[this.messageQueue.length - 1];
    if (lastMessage && now - lastMessage.timestamp < this.MIN_INTERVAL_BETWEEN_MESSAGES) {
      return false;
    }

    return true;
  }

  private async checkCircuitBreaker(): Promise<boolean> {
    if (this.circuitBreakerOpen) {
      this.logger.warn('Telegram: Circuit breaker aberto');
      return false;
    }

    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      this.circuitBreakerOpen = true;
      this.logger.error('Telegram: Circuit breaker ativado devido a muitas falhas consecutivas');

      // Resetar após 5 minutos
      setTimeout(
        () => {
          this.circuitBreakerOpen = false;
          this.consecutiveFailures = 0;
          this.logger.log('Telegram: Circuit breaker resetado');
        },
        5 * 60 * 1000,
      );

      return false;
    }

    return true;
  }

  private isUserBlockedError(error: any): boolean {
    return error.code === 403 && error.description?.includes('bot was blocked');
  }

  private sanitizeMessage(message: string): string {
    return message
      .replace(/[<>&'"]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&#39;',
          '"': '&quot;',
        };
        return entities[char] || char;
      })
      .replace(/\n{3,}/g, '\n\n') // Limitar quebras de linha
      .substring(0, 4096); // Limite do Telegram
  }

  private validateAlert(alert: TelegramAlert): boolean {
    if (!alert.title || alert.title.length > 200) {
      this.logger.error('Telegram: Título inválido');
      return false;
    }

    if (!alert.message || alert.message.length > 4000) {
      this.logger.error('Telegram: Mensagem inválida');
      return false;
    }

    const validTypes = ['error', 'warning', 'info', 'success'];
    if (!validTypes.includes(alert.type)) {
      this.logger.error('Telegram: Tipo inválido');
      return false;
    }

    return true;
  }

  private async sendWithRetry(message: string, maxRetries = 3, baseDelay = 1000): Promise<void> {
    const startTime = Date.now();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.bot.sendMessage(this.chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });

        // Registrar sucesso
        const responseTime = Date.now() - startTime;
        this.metrics.messagesSent++;
        this.metrics.lastMessageTime = Date.now();
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime =
          this.metrics.totalResponseTime / this.metrics.messagesSent;
        this.consecutiveFailures = 0;

        this.messageQueue.push({
          timestamp: Date.now(),
          message: message.substring(0, 50), // Log parcial
        });

        this.logger.log(`Telegram alert sent: ${responseTime}ms`);
        return;
      } catch (error) {
        this.metrics.errors++;
        this.consecutiveFailures++;
        this.lastError = error;

        // Tratamento específico para erros conhecidos
        if (this.isUserBlockedError(error)) {
          this.logger.warn('Telegram: Usuário bloqueou o bot');
          this.metrics.userBlocked++;
          return; // Não tentar novamente
        }

        if (attempt === maxRetries - 1) {
          this.logger.error('Telegram: Falha após todas as tentativas:', error);
          throw error;
        }

        // Backoff exponencial
        const delay = baseDelay * Math.pow(2, attempt);
        this.logger.warn(`Telegram: Tentativa ${attempt + 1} falhou, aguardando ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async sendAlert(alert: TelegramAlert): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      this.logger.debug('Telegram notifications disabled');
      return;
    }

    // Validar alerta
    if (!this.validateAlert(alert)) {
      return;
    }

    // Verificar circuit breaker
    if (!(await this.checkCircuitBreaker())) {
      return;
    }

    // Verificar rate limiting
    if (!(await this.checkRateLimit())) {
      return;
    }

    try {
      const message = this.formatMessage(alert);
      await this.sendWithRetry(message);
    } catch (error) {
      this.logger.error('Failed to send Telegram alert:', error);
    }
  }

  private formatMessage(alert: TelegramAlert): string {
    const timestamp = alert.timestamp || new Date();
    const emoji = this.getEmoji(alert.type);
    const status = this.getStatusText(alert.type);

    let message = `${emoji} <b>${this.sanitizeMessage(alert.title)}</b>\n`;
    message += `📅 <b>Data:</b> ${timestamp.toLocaleString('pt-BR')}\n`;
    message += `🔔 <b>Status:</b> ${status}\n\n`;
    message += `${this.sanitizeMessage(alert.message)}\n`;

    if (alert.details) {
      message += `\n📋 <b>Detalhes:</b>\n`;
      const detailsStr = JSON.stringify(alert.details, null, 2);
      message += `<code>${this.sanitizeMessage(detailsStr)}</code>`;
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
      await this.sendWithRetry(
        '🔔 Teste de conexão - Money Maker Monitor está funcionando!',
        1, // Apenas 1 tentativa para teste
      );
      return true;
    } catch (error) {
      this.logger.error('Telegram connection test failed:', error);
      return false;
    }
  }

  /**
   * Método público para testar a conexão do Telegram
   */
  async testTelegramConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isConnected = await this.testConnection();

      if (isConnected) {
        return {
          success: true,
          message: 'Conexão com Telegram estabelecida com sucesso!',
        };
      } else {
        return {
          success: false,
          message: 'Falha na conexão com Telegram. Verifique as configurações.',
        };
      }
    } catch (error) {
      this.logger.error('Erro ao testar conexão do Telegram:', error);
      return {
        success: false,
        message: `Erro ao testar conexão: ${error.message}`,
      };
    }
  }

  /**
   * Enviar mensagem de teste personalizada
   */
  async sendTestMessage(message: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.sendCustomAlert('info', '🧪 TESTE PERSONALIZADO', message, {
        timestamp: new Date(),
        test: true,
      });

      return {
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
      };
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem de teste:', error);
      return {
        success: false,
        message: `Erro ao enviar mensagem: ${error.message}`,
      };
    }
  }

  /**
   * Obter informações do chat atual
   */
  async getChatInfo(): Promise<{ success: boolean; chatId?: string; message: string }> {
    if (!this.isEnabled || !this.bot) {
      return {
        success: false,
        message: 'Telegram bot não está configurado',
      };
    }

    try {
      const me = await this.bot.getMe();
      return {
        success: true,
        message: `Bot configurado: ${me.first_name} (@${me.username})`,
      };
    } catch (error) {
      this.logger.error('Erro ao obter informações do bot:', error);
      return {
        success: false,
        message: `Erro ao obter informações do bot: ${error.message}`,
      };
    }
  }

  /**
   * Obter updates (últimas mensagens) para encontrar chat ID
   */
  async getUpdates(): Promise<{ success: boolean; updates?: any[]; message: string }> {
    if (!this.isEnabled || !this.bot) {
      return {
        success: false,
        message: 'Telegram bot não está configurado',
      };
    }

    try {
      const updates = await this.bot.getUpdates();
      return {
        success: true,
        updates,
        message: `Encontrados ${updates.length} updates`,
      };
    } catch (error) {
      this.logger.error('Erro ao obter updates:', error);
      return {
        success: false,
        message: `Erro ao obter updates: ${error.message}`,
      };
    }
  }

  /**
   * Health check avançado
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.isEnabled || !this.bot) {
        return {
          status: 'disabled',
          details: { reason: 'Bot não configurado ou desabilitado' },
        };
      }

      const me = await this.bot.getMe();
      const isHealthy = this.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          botName: me.first_name,
          username: me.username,
          chatId: this.chatId,
          enabled: this.isEnabled,
          metrics: await this.getMetrics(),
          lastError: this.lastError,
          circuitBreakerOpen: this.circuitBreakerOpen,
          consecutiveFailures: this.consecutiveFailures,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Obter métricas detalhadas
   */
  async getMetrics(): Promise<object> {
    const successRate =
      this.metrics.messagesSent > 0
        ? ((this.metrics.messagesSent - this.metrics.errors) / this.metrics.messagesSent) * 100
        : 0;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      uptime: Date.now() - this.startTime,
      isHealthy: this.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES,
      circuitBreakerOpen: this.circuitBreakerOpen,
      queueSize: this.messageQueue.length,
    };
  }

  /**
   * Resetar métricas (útil para testes)
   */
  resetMetrics(): void {
    this.metrics = {
      messagesSent: 0,
      errors: 0,
      rateLimitHits: 0,
      userBlocked: 0,
      lastMessageTime: 0,
      averageResponseTime: 0,
      consecutiveFailures: 0,
      totalResponseTime: 0,
    };
    this.consecutiveFailures = 0;
    this.circuitBreakerOpen = false;
    this.messageQueue = [];
    this.lastError = null;
  }
}
