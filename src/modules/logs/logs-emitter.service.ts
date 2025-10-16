import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from './logs.service';
import { EventService } from '../../common/events/event.service';

/**
 * Serviço para capturar e emitir logs
 * Pode ser injetado em qualquer lugar para enviar logs manualmente
 */
@Injectable()
export class LogsEmitterService {
  private readonly logger = new Logger(LogsEmitterService.name);

  constructor(
    private logsService: LogsService,
    private eventService: EventService,
  ) {
    this.logger.log('✅ LogsEmitterService inicializado com EventService');
  }

  /**
   * Emitir um log manualmente via EventService
   */
  emitLog(level: string, message: string, module?: string, clientId?: string, metadata?: any) {
    // Emitir evento via EventService (event-driven)
    this.eventService.emitLog({
      level: level as 'error' | 'warn' | 'info' | 'debug',
      message,
      module,
      clientId,
      metadata,
    });
  }

  /**
   * Métodos de conveniência
   */
  error(message: string, module?: string, metadata?: any) {
    this.emitLog('error', message, module, undefined, metadata);
  }

  warn(message: string, module?: string, metadata?: any) {
    this.emitLog('warn', message, module, undefined, metadata);
  }

  info(message: string, module?: string, metadata?: any) {
    this.emitLog('info', message, module, undefined, metadata);
  }

  debug(message: string, module?: string, metadata?: any) {
    this.emitLog('debug', message, module, undefined, metadata);
  }
}
