import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MetricsModule } from '../common/metrics/metrics.module';
import { MetricsService } from '../common/metrics/metrics.service';
import { MetricsInterceptor } from '../common/metrics/metrics.interceptor';
import { AppModule } from '../app.module';

describe('Prometheus Metrics Tests', () => {
  let app: INestApplication;
  let metricsService: MetricsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // <-- Use o AppModule completo
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar o interceptor globalmente para capturar métricas HTTP
    metricsService = moduleFixture.get<MetricsService>(MetricsService);
    app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Endpoint de Métricas', () => {
    it('deve ter endpoint /metrics disponível', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
      console.log('✅ Endpoint /metrics disponível');
    });

    it('deve retornar métricas no formato Prometheus', async () => {
      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      const metrics = response.text;

      // Verificar se contém métricas básicas do Prometheus
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
      expect(metrics).toContain('process_cpu_seconds_total');
      expect(metrics).toContain('process_resident_memory_bytes');
      console.log('✅ Formato Prometheus correto');
    });
  });

  describe('Métricas de Requisições HTTP', () => {
    it('deve registrar métricas de requisições', async () => {
      await request(app.getHttpServer()).get('/');
      await request(app.getHttpServer()).get('/health');
      await request(app.getHttpServer()).get('/metrics');

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      console.log('✅ Métricas de requisições registradas');
    });

    it('deve registrar métricas por método HTTP', async () => {
      // Chamada GET para endpoint existente (200)
      await request(app.getHttpServer()).get('/metrics');
      // Chamada POST para endpoint inexistente (404)
      await request(app.getHttpServer()).post('/rota-qualquer').send({});

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('method="POST"');
      console.log('✅ Métricas por método HTTP registradas');
    });

    it('deve registrar métricas por status code', async () => {
      // Chamada GET para endpoint existente (200)
      await request(app.getHttpServer()).get('/metrics');
      // Chamada GET para endpoint inexistente (404)
      await request(app.getHttpServer()).get('/rota-inexistente');

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('status="200"');
      expect(metrics).toContain('status="404"');
      console.log('✅ Métricas por status code registradas');
    });
  });

  describe('Métricas de Performance', () => {
    it('deve registrar tempo de resposta', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer()).get('/health');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('http_request_duration_seconds');
      console.log(`✅ Tempo de resposta registrado: ${responseTime}ms`);
    });

    it('deve registrar métricas de memória', async () => {
      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('process_resident_memory_bytes');
      expect(metrics).toContain('nodejs_heap_size_total_bytes');
      expect(metrics).toContain('nodejs_heap_size_used_bytes');
      console.log('✅ Métricas de memória registradas');
    });

    it('deve registrar métricas de CPU', async () => {
      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('process_cpu_seconds_total');
      console.log('✅ Métricas de CPU registradas');
    });
  });

  describe('Métricas Customizadas', () => {
    it('deve registrar métricas de negócio', async () => {
      // Simular algumas operações de negócio
      metricsService.incrementCounter('business_operations_total', { operation: 'user_login' });
      metricsService.incrementCounter('business_operations_total', { operation: 'user_register' });
      metricsService.incrementCounter('business_operations_total', {
        operation: 'payment_processed',
      });

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('business_operations_total');
      expect(metrics).toContain('operation="user_login"');
      expect(metrics).toContain('operation="user_register"');
      expect(metrics).toContain('operation="payment_processed"');
      console.log('✅ Métricas de negócio registradas');
    });

    it('deve registrar histogramas', async () => {
      // Simular medições de tempo
      metricsService.observeHistogram('api_response_time_seconds', 0.1, { endpoint: '/users' });
      metricsService.observeHistogram('api_response_time_seconds', 0.2, { endpoint: '/users' });
      metricsService.observeHistogram('api_response_time_seconds', 0.15, { endpoint: '/users' });

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('api_response_time_seconds');
      expect(metrics).toContain('endpoint="/users"');
      console.log('✅ Histogramas registrados');
    });

    it('deve registrar gauges', async () => {
      // Simular métricas de estado
      metricsService.setGauge('active_users', 150, { region: 'us-east' });
      metricsService.setGauge('active_users', 200, { region: 'us-west' });

      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      expect(metrics).toContain('active_users');
      expect(metrics).toContain('region="us-east"');
      expect(metrics).toContain('region="us-west"');
      console.log('✅ Gauges registrados');
    });
  });

  describe('Performance das Métricas', () => {
    it('deve registrar muitas métricas rapidamente', async () => {
      const startTime = Date.now();
      const metricCount = 100;

      for (let i = 0; i < metricCount; i++) {
        metricsService.incrementCounter('performance_test_total', {
          iteration: i.toString(),
          type: 'test',
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ ${metricCount} métricas registradas em ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve responder endpoint de métricas rapidamente', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer()).get('/metrics');

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Endpoint /metrics respondeu em ${duration}ms`);
      expect(duration).toBeLessThan(500); // Menos de 500ms
    });
  });

  describe('Validação de Métricas', () => {
    it('deve ter métricas com valores válidos', async () => {
      const response = await request(app.getHttpServer()).get('/metrics');
      const metrics = response.text;

      // Verificar se as métricas têm valores numéricos válidos
      const lines = metrics.split('\n');
      const metricLines = lines.filter(
        (line) =>
          line.includes('http_requests_total') && !line.startsWith('#') && line.trim().length > 0,
      );

      if (metricLines.length > 0) {
        const metricLine = metricLines[0];
        const value = parseFloat(metricLine.split(' ').pop() || '0');
        expect(value).toBeGreaterThanOrEqual(0);
        console.log(`✅ Valor de métrica válido: ${value}`);
      }
    });
  });
});
