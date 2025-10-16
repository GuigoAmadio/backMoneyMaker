import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { EventService } from '../events/event.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  constructor(private readonly eventService: EventService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    this.logger.log(`=== LoggerInterceptor: Incoming ${method} ${url} ===`, {
      method,
      url,
      body: this.sanitizeBody(body),
      userId: (user as any)?.id || null,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    // Este trecho de código é responsável por registrar logs após o processamento da requisição HTTP.
    // Ele é executado logo após o logger de "incoming" (entrada), que ocorre antes da execução do controller.
    // Aqui, usamos o operador `tap` do RxJS para capturar a resposta (ou erro) assim que ela é emitida pelo controller ou serviço.
    // O logger de "outgoing" (saída) registra informações como método, URL, status da resposta, tempo de execução e tamanho da resposta.
    // Se ocorrer um erro durante o processamento, o operador `catchError` captura o erro, registra um log detalhado e relança o erro.
    // Portanto, este trecho é executado após o logger de incoming, no momento em que a resposta está sendo enviada ao cliente (ou quando ocorre um erro).

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        const logMessage = `${method} ${url} ${statusCode} - ${duration}ms`;

        this.logger.log(`=== LoggerInterceptor: Outgoing ${logMessage} ===`, {
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          responseSize: JSON.stringify(data).length,
        });

        // Emitir evento via EventService (event-driven)
        this.eventService.emitHttpRequest({
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          clientId: (request as any).clientId || null,
          responseSize: JSON.stringify(data).length,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        const logMessage = `${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`;

        this.logger.error(`=== LoggerInterceptor: Error ${logMessage} ===`, {
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          error: error.message,
          stack: error.stack,
        });

        // Emitir evento de erro via EventService
        this.eventService.emitHttpRequest({
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          clientId: (request as any).clientId || null,
        });

        // Emitir log de erro
        this.eventService.emitLog({
          level: 'error',
          message: logMessage,
          module: 'HTTP',
          userId: (user as any)?.id || null,
          clientId: (request as any).clientId || null,
          metadata: { error: error.message, stack: error.stack },
        });

        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }
}
