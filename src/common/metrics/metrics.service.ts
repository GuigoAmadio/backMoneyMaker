import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
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
    // Coletar métricas padrão do Node.js
    collectDefaultMetrics();
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
    return register.metrics();
  }

  // Obter métricas em formato JSON
  async getMetricsJson() {
    return register.getMetricsAsJSON();
  }
}
