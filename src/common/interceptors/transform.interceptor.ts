import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    this.logger.log(
      `=== TransformInterceptor: Processando requisição ${request.method} ${request.url} ===`,
    );

    return next.handle().pipe(
      map((data) => {
        this.logger.log(`=== TransformInterceptor: Transformando resposta ===`);

        // Se a resposta já tem a estrutura esperada (success, data), não transformar
        if (data && typeof data === 'object' && 'success' in data) {
          this.logger.log(`=== TransformInterceptor: Resposta já tem estrutura esperada ===`);
          return data as ApiResponse<T>;
        }

        // Caso contrário, aplicar a transformação padrão
        this.logger.log(`=== TransformInterceptor: Aplicando transformação padrão ===`);
        return {
          success: true,
          data,
        };
      }),
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `=== TransformInterceptor: ${request.method} ${request.url} - ${duration}ms ===`,
        );
      }),
    );
  }
}
