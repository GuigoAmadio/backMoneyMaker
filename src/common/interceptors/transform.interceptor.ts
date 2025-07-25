import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
  method: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        // Se a resposta já tem a estrutura esperada (success, data, message), não transformar
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        // Caso contrário, aplicar a transformação padrão
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        };
      }),
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`${request.method} ${request.url} - ${duration}ms`);
      }),
    );
  }
}
