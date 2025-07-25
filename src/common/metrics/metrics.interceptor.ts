import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.url;
    const clientId = req.headers['x-client-id'] || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const status = context.switchToHttp().getResponse().statusCode;
        this.metricsService.incrementHttpRequest(method, route, status, clientId);
        this.metricsService.observeHttpRequestDuration(method, route, Date.now() - now, clientId);
      }),
      catchError((err) => {
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode || err.status || 500;
        this.metricsService.incrementHttpRequest(method, route, status, clientId);
        this.metricsService.observeHttpRequestDuration(method, route, Date.now() - now, clientId);
        return throwError(() => err);
      }),
    );
  }
}
