import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Verificar se a aplicação responde
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      
      // Verificar espaço em disco
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      
      // Verificar uso de memória
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      
      // Verificações customizadas
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
