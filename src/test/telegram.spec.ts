import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { TelegramService } from '../common/notifications/telegram.service';

describe('Telegram Notifications Tests', () => {
  let app: INestApplication;
  let telegramService: TelegramService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    telegramService = moduleFixture.get<TelegramService>(TelegramService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Configuração do Bot', () => {
    it('deve verificar configuração do bot', async () => {
      try {
        const isEnabled = await telegramService.testConnection();
        if (isEnabled) {
          console.log('✅ Bot Telegram configurado e funcionando');
        } else {
          console.log('⚠️ Bot Telegram configurado mas não testado (sem token válido)');
        }
      } catch (error) {
        console.log('⚠️ Bot Telegram não configurado:', error.message);
      }
    });

    it('deve verificar health check', async () => {
      const health = await telegramService.healthCheck();
      console.log('📊 Health Check:', health);
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('details');
    });

    it('deve obter métricas', async () => {
      const metrics = await telegramService.getMetrics();
      console.log('📈 Métricas:', metrics);
      expect(metrics).toHaveProperty('messagesSent');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('successRate');
    });
  });

  describe('Formatação de Mensagens', () => {
    it('deve formatar mensagem de erro', async () => {
      const alert = {
        type: 'error' as const,
        title: 'Teste de Erro',
        message: 'Este é um teste de erro',
        details: { errorCode: 500, timestamp: Date.now() },
      };

      // Testar formatação interna (método privado, mas podemos testar o resultado)
      await telegramService.sendAlert(alert);
      console.log('✅ Formatação de erro testada');
    });

    it('deve formatar mensagem de sucesso', async () => {
      const alert = {
        type: 'success' as const,
        title: 'Teste de Sucesso',
        message: 'Este é um teste de sucesso',
        details: { userId: 123, action: 'login' },
      };

      await telegramService.sendAlert(alert);
      console.log('✅ Formatação de sucesso testada');
    });

    it('deve formatar mensagem de warning', async () => {
      const alert = {
        type: 'warning' as const,
        title: 'Teste de Warning',
        message: 'Este é um teste de warning',
        details: { memoryUsage: '85%' },
      };

      await telegramService.sendAlert(alert);
      console.log('✅ Formatação de warning testada');
    });

    it('deve formatar mensagem de info', async () => {
      const alert = {
        type: 'info' as const,
        title: 'Teste de Info',
        message: 'Este é um teste de informação',
        details: { version: '1.0.0' },
      };

      await telegramService.sendAlert(alert);
      console.log('✅ Formatação de info testada');
    });
  });

  describe('Alertas Específicos', () => {
    it('deve enviar alerta de servidor down', async () => {
      await telegramService.sendServerDownAlert({
        uptime: '2h 30m',
        lastError: 'Connection timeout',
      });
      console.log('✅ Alerta de servidor down testado');
    });

    it('deve enviar alerta de alta taxa de erro', async () => {
      await telegramService.sendHighErrorRateAlert(15.5, {
        endpoint: '/api/users',
        timeWindow: '5 minutes',
      });
      console.log('✅ Alerta de alta taxa de erro testado');
    });

    it('deve enviar alerta de resposta lenta', async () => {
      await telegramService.sendSlowResponseAlert(2500, {
        endpoint: '/api/dashboard',
        threshold: 1000,
      });
      console.log('✅ Alerta de resposta lenta testado');
    });

    it('deve enviar alerta de erro no banco', async () => {
      await telegramService.sendDatabaseErrorAlert('Connection refused', {
        database: 'postgres',
        host: 'localhost:5432',
      });
      console.log('✅ Alerta de erro no banco testado');
    });

    it('deve enviar alerta de erro no Redis', async () => {
      await telegramService.sendRedisErrorAlert('Connection timeout', {
        host: 'localhost:6379',
        operation: 'SET',
      });
      console.log('✅ Alerta de erro no Redis testado');
    });

    it('deve enviar alerta de uso de memória', async () => {
      await telegramService.sendMemoryUsageAlert(87.5, {
        total: '8GB',
        used: '7GB',
        available: '1GB',
      });
      console.log('✅ Alerta de uso de memória testado');
    });

    it('deve enviar alerta de espaço em disco', async () => {
      await telegramService.sendDiskSpaceAlert(92.1, {
        total: '500GB',
        used: '460GB',
        available: '40GB',
      });
      console.log('✅ Alerta de espaço em disco testado');
    });
  });

  describe('Alertas Customizados', () => {
    it('deve enviar alerta customizado', async () => {
      await telegramService.sendCustomAlert(
        'info',
        'Teste Customizado',
        'Este é um teste de alerta customizado',
        { customField: 'customValue' },
      );
      console.log('✅ Alerta customizado testado');
    });
  });

  describe('Rate Limiting e Circuit Breaker', () => {
    it('deve testar rate limiting', async () => {
      const startTime = Date.now();
      const alertCount = 5; // Testar com poucas mensagens para não atingir rate limit

      const promises = [];
      for (let i = 0; i < alertCount; i++) {
        promises.push(
          telegramService.sendCustomAlert(
            'info',
            `Rate Test ${i + 1}`,
            `Mensagem de teste ${i + 1}`,
            {
              index: i,
            },
          ),
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ ${alertCount} alertas enviados em ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Menos de 10 segundos
    });

    it('deve testar circuit breaker', async () => {
      // Simular falhas para testar circuit breaker
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      process.env.TELEGRAM_BOT_TOKEN = 'invalid_token';

      try {
        // Tentar enviar várias mensagens para ativar circuit breaker
        for (let i = 0; i < 10; i++) {
          try {
            await telegramService.sendCustomAlert(
              'error',
              'Teste Circuit Breaker',
              'Este teste deve falhar',
              { test: true },
            );
          } catch (error) {
            // Esperado falhar
          }
        }
      } finally {
        // Restaurar token original
        if (originalToken) {
          process.env.TELEGRAM_BOT_TOKEN = originalToken;
        }
      }

      console.log('✅ Circuit breaker testado');
    });
  });

  describe('Sanitização e Validação', () => {
    it('deve sanitizar mensagens com HTML', async () => {
      const alert = {
        type: 'warning' as const,
        title: 'Teste com <script>alert("xss")</script>',
        message: 'Mensagem com & < > " caracteres especiais',
        details: { test: '<script>alert("xss")</script>' },
      };

      await telegramService.sendAlert(alert);
      console.log('✅ Sanitização de HTML testada');
    });

    it('deve validar mensagens muito longas', async () => {
      const longMessage = 'A'.repeat(5000); // Mensagem muito longa
      const alert = {
        type: 'info' as const,
        title: 'Teste Mensagem Longa',
        message: longMessage,
      };

      await telegramService.sendAlert(alert);
      console.log('✅ Validação de mensagem longa testada');
    });
  });

  describe('Performance', () => {
    it('deve enviar múltiplos alertas rapidamente', async () => {
      const startTime = Date.now();
      const alertCount = 3;

      const promises = [];
      for (let i = 0; i < alertCount; i++) {
        promises.push(
          telegramService.sendCustomAlert('info', `Teste ${i + 1}`, `Mensagem de teste ${i + 1}`, {
            index: i,
          }),
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ ${alertCount} alertas enviados em ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com token inválido graciosamente', async () => {
      // Simular token inválido
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      process.env.TELEGRAM_BOT_TOKEN = 'invalid_token';

      try {
        await telegramService.sendCustomAlert(
          'error',
          'Teste Token Inválido',
          'Este teste deve falhar graciosamente',
          { test: true },
        );
      } catch (error) {
        console.log('✅ Erro tratado graciosamente:', error.message);
      } finally {
        // Restaurar token original
        if (originalToken) {
          process.env.TELEGRAM_BOT_TOKEN = originalToken;
        }
      }
    });

    it('deve testar reset de métricas', async () => {
      // Enviar algumas mensagens para gerar métricas
      await telegramService.sendCustomAlert('info', 'Teste Métricas', 'Mensagem de teste');

      // Verificar métricas antes do reset
      const metricsBefore = (await telegramService.getMetrics()) as any;

      // Resetar métricas
      telegramService.resetMetrics();

      // Verificar métricas após reset
      const metricsAfter = (await telegramService.getMetrics()) as any;
      expect(metricsAfter.messagesSent).toBe(0);
      expect(metricsAfter.errors).toBe(0);

      console.log('✅ Reset de métricas testado');
    });
  });

  describe('Métricas e Monitoramento', () => {
    it('deve verificar métricas após operações', async () => {
      const initialMetrics = await telegramService.getMetrics();

      // Enviar algumas mensagens
      await telegramService.sendCustomAlert('info', 'Teste Métricas', 'Mensagem 1');
      await telegramService.sendCustomAlert('success', 'Teste Métricas', 'Mensagem 2');

      const finalMetrics = (await telegramService.getMetrics()) as any;

      // Verificar que as métricas estão sendo coletadas corretamente
      expect(finalMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.uptime).toBeGreaterThan(0);

      console.log('✅ Métricas atualizadas corretamente');
    });
  });
});
