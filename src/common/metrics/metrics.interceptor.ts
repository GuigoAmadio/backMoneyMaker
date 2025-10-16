import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {
    this.logger.log('🔧 MetricsInterceptor inicializado');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.url;
    const clientId = req.headers['x-client-id'] || 'unknown';

    // Log apenas para rotas de métricas para debug
    if (route.includes('metrics')) {
      this.logger.log(`📊 === MetricsInterceptor: Interceptando ${method} ${route} ===`);
    }

    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode;
        const duration = Date.now() - now;
        
        // Calcular tamanho da resposta
        let responseSize = 0;
        try {
          const responseString = JSON.stringify(data);
          responseSize = Buffer.byteLength(responseString, 'utf8');
        } catch (e) {
          // Se não conseguir serializar, estimar baseado no objeto
          responseSize = JSON.stringify(data || {}).length;
        }
        
        this.metricsService.incrementHttpRequest(method, route, status, clientId);
        this.metricsService.observeHttpRequestDuration(method, route, duration, clientId);
        this.metricsService.observeHttpResponseSize(method, route, responseSize, clientId);

        if (route.includes('metrics')) {
          this.logger.log(
            `📊 === MetricsInterceptor: Métricas registradas para ${method} ${route} - Status: ${status} - Duração: ${duration}ms - Tamanho: ${responseSize} bytes ===`,
          );
        }
      }),
      catchError((err) => {
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode || err.status || 500;
        const duration = Date.now() - now;
        
        this.metricsService.incrementHttpRequest(method, route, status, clientId);
        this.metricsService.observeHttpRequestDuration(method, route, duration, clientId);
        
        // Tamanho de erro estimado
        const errorSize = JSON.stringify(err.response || {}).length;
        this.metricsService.observeHttpResponseSize(method, route, errorSize, clientId);

        if (route.includes('metrics')) {
          this.logger.error(
            `❌ === MetricsInterceptor: Erro registrado para ${method} ${route} - Status: ${status} - Duração: ${duration}ms ===`,
            err,
          );
        }

        return throwError(() => err);
      }),
    );
  }
}
