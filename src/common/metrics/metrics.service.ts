import { Injectable, Logger } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  // Métricas HTTP
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status', 'client_id'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'client_id'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly httpResponseSize = new Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'client_id'],
    buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  });

  // Métricas de negócio
  private readonly appointmentsCreated = new Counter({
    name: 'appointments_created_total',
    help: 'Total number of appointments created',
    labelNames: ['client_id'],
  });

  private readonly usersActive = new Gauge({
    name: 'users_active',
    help: 'Number of active users',
    labelNames: ['client_id'],
  });

  // Métricas de sistema
  private readonly databaseConnections = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
  });

  private readonly cacheHitRate = new Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
  });

  // Métricas customizadas dinâmicas
  private readonly customCounters = new Map<string, Counter>();
  private readonly customHistograms = new Map<string, Histogram>();
  private readonly customGauges = new Map<string, Gauge>();

  constructor() {
    this.logger.log('🔧 MetricsService inicializado');
    // Coletar métricas padrão do Node.js
    collectDefaultMetrics();
    this.logger.log('📊 Métricas padrão do Node.js coletadas');
  }

  // Métodos para incrementar métricas
  incrementHttpRequest(method: string, route: string, status: number, clientId?: string) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status: status.toString(),
      client_id: clientId || 'unknown',
    });
  }

  observeHttpRequestDuration(method: string, route: string, duration: number, clientId?: string) {
    this.httpRequestDuration.observe(
      { method, route, client_id: clientId || 'unknown' },
      duration / 1000,
    );
  }

  observeHttpResponseSize(method: string, route: string, sizeInBytes: number, clientId?: string) {
    this.httpResponseSize.observe(
      { method, route, client_id: clientId || 'unknown' },
      sizeInBytes,
    );
  }

  incrementAppointmentCreated(clientId: string) {
    this.appointmentsCreated.inc({ client_id: clientId });
  }

  setActiveUsers(count: number, clientId: string) {
    this.usersActive.set({ client_id: clientId }, count);
  }

  setDatabaseConnections(count: number) {
    this.databaseConnections.set(count);
  }

  setCacheHitRate(rate: number) {
    this.cacheHitRate.set(rate);
  }

  // Métodos para métricas customizadas dinâmicas
  incrementCounter(name: string, labels: Record<string, string> = {}) {
    let counter = this.customCounters.get(name);
    if (!counter) {
      counter = new Counter({
        name,
        help: `Custom counter: ${name}`,
        labelNames: Object.keys(labels),
      });
      this.customCounters.set(name, counter);
    }
    counter.inc(labels);
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    let histogram = this.customHistograms.get(name);
    if (!histogram) {
      histogram = new Histogram({
        name,
        help: `Custom histogram: ${name}`,
        labelNames: Object.keys(labels),
        buckets: [0.1, 0.5, 1, 2, 5],
      });
      this.customHistograms.set(name, histogram);
    }
    histogram.observe(labels, value);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    let gauge = this.customGauges.get(name);
    if (!gauge) {
      gauge = new Gauge({
        name,
        help: `Custom gauge: ${name}`,
        labelNames: Object.keys(labels),
      });
      this.customGauges.set(name, gauge);
    }
    gauge.set(labels, value);
  }

  // Obter métricas em formato Prometheus
  async getMetrics(): Promise<string> {
    this.logger.log('📊 === MetricsService: Gerando métricas em formato Prometheus ===');
    try {
      const metrics = await register.metrics();
      this.logger.log(
        `📊 === MetricsService: Métricas geradas com sucesso (${metrics.length} caracteres) ===`,
      );
      this.logger.debug(
        `📊 === MetricsService: Preview das métricas ===\n${metrics.substring(0, 200)}...`,
      );
      return metrics;
    } catch (error) {
      this.logger.error('❌ === MetricsService: Erro ao gerar métricas Prometheus ===', error);
      throw error;
    }
  }

  // Obter métricas em formato JSON
  async getMetricsJson() {
    this.logger.log('📊 === MetricsService: Gerando métricas em formato JSON ===');
    try {
      const metricsJson = await register.getMetricsAsJSON();
      this.logger.log(
        `📊 === MetricsService: Métricas JSON geradas com sucesso (${metricsJson.length} métricas) ===`,
      );
      this.logger.debug(
        `📊 === MetricsService: Preview das métricas JSON ===\n${JSON.stringify(metricsJson.slice(0, 2), null, 2)}...`,
      );
      return metricsJson;
    } catch (error) {
      this.logger.error('❌ === MetricsService: Erro ao gerar métricas JSON ===', error);
      throw error;
    }
  }

  // Obter métricas detalhadas para dashboard
  async getDetailedMetrics(clientId?: string) {
    this.logger.log('📊 === MetricsService: Gerando métricas detalhadas ===');
    
    try {
      const metrics = await register.getMetricsAsJSON();
      
      // Processar métricas para formato mais amigável
      const httpRequests = metrics.find((m: any) => m.name === 'http_requests_total');
      const httpDuration = metrics.find((m: any) => m.name === 'http_request_duration_seconds');
      const httpSize = metrics.find((m: any) => m.name === 'http_response_size_bytes');
      
      // Agrupar por rota
      const routeMetrics: any[] = [];
      
      if (httpRequests && httpRequests.values) {
        const routeMap = new Map();
        
        httpRequests.values.forEach((metric: any) => {
          const route = metric.labels?.route || 'unknown';
          const method = metric.labels?.method || 'unknown';
          const status = metric.labels?.status || 'unknown';
          const key = `${method}:${route}`;
          
          if (!routeMap.has(key)) {
            routeMap.set(key, {
              method,
              route,
              totalRequests: 0,
              statusCodes: {},
            });
          }
          
          const routeData = routeMap.get(key);
          routeData.totalRequests += metric.value;
          routeData.statusCodes[status] = (routeData.statusCodes[status] || 0) + metric.value;
        });
        
        routeMetrics.push(...Array.from(routeMap.values()));
      }
      
      // Calcular estatísticas de duração
      const durationStats: any[] = [];
      if (httpDuration && httpDuration.values) {
        const durationMap = new Map();
        
        httpDuration.values.forEach((metric: any) => {
          const route = metric.labels?.route || 'unknown';
          const method = metric.labels?.method || 'unknown';
          const key = `${method}:${route}`;
          
          if (!durationMap.has(key)) {
            durationMap.set(key, {
              method,
              route,
              count: 0,
              sum: 0,
            });
          }
          
          const durationData = durationMap.get(key);
          if (metric.metricName?.includes('count')) {
            durationData.count = metric.value;
          } else if (metric.metricName?.includes('sum')) {
            durationData.sum = metric.value;
          }
        });
        
        durationMap.forEach((value, key) => {
          durationStats.push({
            ...value,
            avgDuration: value.count > 0 ? value.sum / value.count : 0,
          });
        });
      }
      
      // Calcular estatísticas de tamanho
      const sizeStats: any[] = [];
      if (httpSize && httpSize.values) {
        const sizeMap = new Map();
        
        httpSize.values.forEach((metric: any) => {
          const route = metric.labels?.route || 'unknown';
          const method = metric.labels?.method || 'unknown';
          const key = `${method}:${route}`;
          
          if (!sizeMap.has(key)) {
            sizeMap.set(key, {
              method,
              route,
              count: 0,
              sum: 0,
            });
          }
          
          const sizeData = sizeMap.get(key);
          if (metric.metricName?.includes('count')) {
            sizeData.count = metric.value;
          } else if (metric.metricName?.includes('sum')) {
            sizeData.sum = metric.value;
          }
        });
        
        sizeMap.forEach((value, key) => {
          sizeStats.push({
            ...value,
            avgSize: value.count > 0 ? value.sum / value.count : 0,
            totalSize: value.sum,
          });
        });
      }
      
      return {
        routes: routeMetrics,
        duration: durationStats,
        size: sizeStats,
        summary: {
          totalRequests: routeMetrics.reduce((sum, r) => sum + r.totalRequests, 0),
          avgResponseTime: durationStats.reduce((sum, d) => sum + d.avgDuration, 0) / (durationStats.length || 1),
          totalDataTransferred: sizeStats.reduce((sum, s) => sum + s.totalSize, 0),
        },
      };
    } catch (error) {
      this.logger.error('❌ Erro ao gerar métricas detalhadas:', error);
      throw error;
    }
  }
}
