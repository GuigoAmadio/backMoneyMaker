import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Verificar espa�o em disco

      // Verificar uso de mem�ria
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB

      // Verifica��es customizadas
      () => this.healthService.checkDatabase(),
      () => this.healthService.checkRedis(),
      () => this.healthService.checkServerHealth(),
    ]);
  }

  @Get('detailed')
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }

  @Get('metrics')
  async getMetrics() {
    return this.healthService.getMetrics();
  }
}
