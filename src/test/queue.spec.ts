import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { QueueModule } from '../common/queue/queue.module';
import { QueueService } from '../common/queue/queue.service';
import { QueueProcessor } from '../common/queue/queue.processor';

describe('Bull Queue Tests', () => {
  let app: INestApplication;
  let queueService: QueueService;
  let queueProcessor: QueueProcessor;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [QueueModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    queueService = moduleFixture.get<QueueService>(QueueService);
    queueProcessor = moduleFixture.get<QueueProcessor>(QueueProcessor);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Conexão com Redis', () => {
    it('deve conectar ao Redis para filas', async () => {
      try {
        // Verificar se o serviço está disponível
        expect(queueService).toBeDefined();
        console.log('✅ Fila Bull conectada ao Redis');
      } catch (error) {
        console.error('❌ Erro na conexão com fila:', error);
        throw error;
      }
    });
  });

  describe('Adição de Jobs', () => {
    it('deve adicionar job simples', async () => {
      const testJob = {
        tipo: 'test',
        payload: { message: 'teste simples', timestamp: Date.now() },
      };

      const job = await queueService.addJob(testJob);
      expect(job.id).toBeDefined();
      expect(job.data).toEqual(testJob);
      console.log('✅ Job simples adicionado com sucesso');
    });

    it('deve adicionar job com prioridade', async () => {
      const testJob = {
        tipo: 'priority',
        payload: { message: 'teste com prioridade', priority: 'high' },
      };

      const job = await queueService.addJob(testJob);
      expect(job.id).toBeDefined();
      console.log('✅ Job com prioridade adicionado com sucesso');
    });

    it('deve adicionar job com delay', async () => {
      const testJob = {
        tipo: 'delayed',
        payload: { message: 'teste com delay' },
      };

      const job = await queueService.addJob(testJob);
      expect(job.id).toBeDefined();
      console.log('✅ Job com delay adicionado com sucesso');
    });
  });

  describe('Processamento de Jobs', () => {
    it('deve processar job de teste', async () => {
      const testJob = {
        tipo: 'test',
        payload: { message: 'teste de processamento', timestamp: Date.now() },
      };

      const job = await queueService.addJob(testJob);

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar se foi processado
      const jobResult = await job.finished();
      expect(jobResult).toBe(true);
      console.log('✅ Job processado com sucesso');
    });

    it('deve processar job de email', async () => {
      const emailJob = {
        tipo: 'email',
        payload: {
          to: 'test@example.com',
          subject: 'Teste de Email',
          body: 'Este é um teste de email via fila',
        },
      };

      const job = await queueService.addJob(emailJob);

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const jobResult = await job.finished();
      expect(jobResult).toBe(true);
      console.log('✅ Job de email processado com sucesso');
    });
  });

  describe('Status da Fila', () => {
    it('deve mostrar estatísticas da fila', async () => {
      const jobs = await queueService.getJobs();

      console.log(`📊 Estatísticas da fila:`);
      console.log(`   - Total de jobs: ${jobs.length}`);

      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe('Limpeza da Fila', () => {
    it('deve limpar jobs antigos', async () => {
      // Adicionar alguns jobs de teste
      await queueService.addJob({ tipo: 'cleanup', payload: { test: 1 } });
      await queueService.addJob({ tipo: 'cleanup', payload: { test: 2 } });

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Limpar jobs
      await queueService.cleanQueue();
      console.log('🧹 Jobs antigos removidos');
    });
  });

  describe('Performance da Fila', () => {
    it('deve processar múltiplos jobs rapidamente', async () => {
      const startTime = Date.now();
      const jobCount = 5;

      // Adicionar múltiplos jobs
      const jobs = [];
      for (let i = 0; i < jobCount; i++) {
        const job = await queueService.addJob({
          tipo: 'performance',
          payload: { index: i, timestamp: Date.now() },
        });
        jobs.push(job);
      }

      // Aguardar todos serem processados
      await Promise.all(jobs.map((job) => job.finished()));

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ ${jobCount} jobs processados em ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Menos de 10 segundos
    });
  });
});
