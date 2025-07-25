import { Injectable, NestMiddleware } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: any, res: any, next: () => void) {
    const start = Date.now();
    const method = req.method;
    const route = req.originalUrl || req.url;
    const clientId = req.headers['x-client-id'] || 'unknown';

    res.on('finish', () => {
      const status = res.statusCode;
      this.metricsService.incrementHttpRequest(method, route, status, clientId);
      this.metricsService.observeHttpRequestDuration(method, route, Date.now() - start, clientId);
    });

    next();
  }
}
