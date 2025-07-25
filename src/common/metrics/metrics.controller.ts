import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller({ path: 'metrics', version: undefined })
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('json')
  async getMetricsJson(): Promise<any> {
    return this.metricsService.getMetricsJson();
  }
}
