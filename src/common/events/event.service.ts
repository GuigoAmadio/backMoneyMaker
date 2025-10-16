import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BaseEvent {
  eventType: string;
  timestamp: Date;
  source: string;
  data: any;
}

export interface LogEvent extends BaseEvent {
  eventType: 'log.created';
  data: {
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    module?: string;
    clientId?: string;
    userId?: string;
    metadata?: any;
  };
}

export interface HttpRequestEvent extends BaseEvent {
  eventType: 'http.request';
  data: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userId?: string;
    clientId?: string;
    responseSize?: number;
  };
}

export interface BusinessEvent extends BaseEvent {
  eventType: 'business.action';
  data: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    clientId?: string;
    metadata?: any;
  };
}

export interface SecurityEvent extends BaseEvent {
  eventType: 'security.event';
  data: {
    event: string;
    ip?: string;
    userAgent?: string;
    userId?: string;
    clientId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
  };
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Emitir log event
   */
  emitLog(data: LogEvent['data']) {
    const event: LogEvent = {
      eventType: 'log.created',
      timestamp: new Date(),
      source: 'system',
      data,
    };

    this.eventEmitter.emit('log.created', event);
    this.logger.debug(`📝 Log event emitted: ${data.level} - ${data.message}`);
  }

  /**
   * Emitir HTTP request event
   */
  emitHttpRequest(data: HttpRequestEvent['data']) {
    const event: HttpRequestEvent = {
      eventType: 'http.request',
      timestamp: new Date(),
      source: 'http',
      data,
    };

    this.eventEmitter.emit('http.request', event);
    this.logger.debug(`🌐 HTTP event emitted: ${data.method} ${data.url} ${data.statusCode}`);
  }

  /**
   * Emitir business event
   */
  emitBusinessAction(data: BusinessEvent['data']) {
    const event: BusinessEvent = {
      eventType: 'business.action',
      timestamp: new Date(),
      source: 'business',
      data,
    };

    this.eventEmitter.emit('business.action', event);
    this.logger.debug(`💼 Business event emitted: ${data.action} on ${data.entity}`);
  }

  /**
   * Emitir security event
   */
  emitSecurityEvent(data: SecurityEvent['data']) {
    const event: SecurityEvent = {
      eventType: 'security.event',
      timestamp: new Date(),
      source: 'security',
      data,
    };

    this.eventEmitter.emit('security.event', event);
    this.logger.warn(`🔒 Security event emitted: ${data.event} (${data.severity})`);
  }

  /**
   * Emitir evento customizado
   */
  emit(eventType: string, data: any, source: string = 'custom') {
    const event: BaseEvent = {
      eventType,
      timestamp: new Date(),
      source,
      data,
    };

    this.eventEmitter.emit(eventType, event);
    this.logger.debug(`📡 Custom event emitted: ${eventType}`);
  }

  /**
   * Escutar eventos (para testes ou debugging)
   */
  on(eventType: string, listener: (event: BaseEvent) => void) {
    this.eventEmitter.on(eventType, listener);
  }

  /**
   * Remover listener
   */
  off(eventType: string, listener: (event: BaseEvent) => void) {
    this.eventEmitter.off(eventType, listener);
  }

  /**
   * Listar todos os listeners ativos
   */
  getListeners(eventType?: string) {
    return this.eventEmitter.listeners(eventType);
  }

  /**
   * Estatísticas do EventEmitter
   */
  getStats() {
    return {
      listenersCount: this.eventEmitter.listenerCount(),
      maxListeners: this.eventEmitter.getMaxListeners(),
      eventNames: this.eventEmitter.eventNames(),
    };
  }
}
