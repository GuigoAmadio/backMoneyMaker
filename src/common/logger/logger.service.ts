import { Injectable, LoggerService as NestLoggerService, Inject } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(@Inject('WINSTON_MODULE_PROVIDER') private readonly logger: Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Métodos customizados para diferentes tipos de log
  logRequest(
    method: string,
    url: string,
    duration: number,
    statusCode: number,
    userId?: string,
    clientId?: string,
  ) {
    this.logger.info('HTTP Request', {
      method,
      url,
      duration: `${duration}ms`,
      statusCode,
      userId,
      clientId,
      type: 'request',
    });
  }

  logDatabase(query: string, duration: number, success: boolean, context?: string) {
    this.logger.info('Database Query', {
      query,
      duration: `${duration}ms`,
      success,
      context,
      type: 'database',
    });
  }

  logCache(operation: string, key: string, duration: number, hit: boolean, context?: string) {
    this.logger.info('Cache Operation', {
      operation,
      key,
      duration: `${duration}ms`,
      hit,
      context,
      type: 'cache',
    });
  }

  logSecurity(event: string, details: any, context?: string) {
    this.logger.warn('Security Event', {
      event,
      details,
      context,
      type: 'security',
    });
  }

  logBusiness(
    action: string,
    entity: string,
    entityId: string,
    userId?: string,
    clientId?: string,
    details?: any,
  ) {
    this.logger.info('Business Action', {
      action,
      entity,
      entityId,
      userId,
      clientId,
      details,
      type: 'business',
    });
  }

  logPerformance(operation: string, duration: number, context?: string, details?: any) {
    this.logger.info('Performance', {
      operation,
      duration: `${duration}ms`,
      context,
      details,
      type: 'performance',
    });
  }
}
