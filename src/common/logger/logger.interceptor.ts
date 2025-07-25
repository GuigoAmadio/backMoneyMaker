import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    this.logger.log(`Incoming ${method} ${url}`, {
      method,
      url,
      body: this.sanitizeBody(body),
      userId: (user as any)?.id || null,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        this.logger.log(`Outgoing ${method} ${url} ${statusCode} - ${duration}ms`, {
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          responseSize: JSON.stringify(data).length,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        this.logger.error(`Error ${method} ${url} ${statusCode} - ${duration}ms`, {
          method,
          url,
          statusCode,
          duration,
          userId: (user as any)?.id || null,
          error: error.message,
          stack: error.stack,
        });
        throw error;
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
