import { Controller, Get, Header, Logger, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {
    this.logger.log('🔧 MetricsController inicializado');
  }

  @Get()
  @Version(VERSION_NEUTRAL)
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    this.logger.log('📊 === MetricsController: Requisição GET /metrics recebida ===');
    try {
      const metrics = await this.metricsService.getMetrics();
      this.logger.log(
        `📊 === MetricsController: Métricas geradas com sucesso (${metrics.length} caracteres) ===`,
      );
      return metrics;
    } catch (error) {
      this.logger.error('❌ === MetricsController: Erro ao gerar métricas ===', error);
      throw error;
    }
  }

  @Get('json')
  @Version(VERSION_NEUTRAL)
  async getMetricsJson(): Promise<any> {
    this.logger.log('📊 === MetricsController: Requisição GET /metrics/json recebida ===');
    try {
      const metricsJson = await this.metricsService.getMetricsJson();
      this.logger.log(
        `📊 === MetricsController: Métricas JSON geradas com sucesso (${JSON.stringify(metricsJson).length} caracteres) ===`,
      );
      return metricsJson;
    } catch (error) {
      this.logger.error('❌ === MetricsController: Erro ao gerar métricas JSON ===', error);
      throw error;
    }
  }

  @Get('detailed')
  @Version(VERSION_NEUTRAL)
  async getDetailedMetrics(): Promise<any> {
    this.logger.log('📊 === MetricsController: Requisição GET /metrics/detailed recebida ===');
    try {
      const detailedMetrics = await this.metricsService.getDetailedMetrics();
      this.logger.log(
        `📊 === MetricsController: Métricas detalhadas geradas com sucesso ===`,
      );
      return {
        success: true,
        data: detailedMetrics,
      };
    } catch (error) {
      this.logger.error('❌ === MetricsController: Erro ao gerar métricas detalhadas ===', error);
      throw error;
    }
  }
}
