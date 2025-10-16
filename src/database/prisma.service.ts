import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
      // Configurações de connection pooling otimizadas
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configurações de performance serão aplicadas via variáveis de ambiente
    });

    // Log das queries apenas em desenvolvimento e com limite de performance
    if (process.env.NODE_ENV === 'development') {
      let queryCount = 0;
      const maxQueriesToLog = 50; // Limitar logs para não impactar performance

      (this as any).$on('query', (e: any) => {
        queryCount++;
        if (queryCount <= maxQueriesToLog) {
          this.logger.log(`Query ${queryCount}: ${e.query}`);
          this.logger.log(`Params: ${e.params}`);
          this.logger.log(`Duration: ${e.duration}ms`);

          // Alertar queries lentas
          if (e.duration > 1000) {
            this.logger.warn(`⚠️ Query lenta detectada: ${e.duration}ms`);
          }
        }
      });
    }

    (this as any).$on('error', (e: any) => {
      this.logger.error(e);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conectado ao banco de dados com connection pooling otimizado');
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao banco de dados:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado do banco de dados');
  }

  /**
   * Limpeza de dados para testes
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Operação permitida apenas em ambiente de teste');
    }

    const models = Reflect.ownKeys(this).filter((key) => key[0] !== '_');

    return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  }

  /**
   * Executa transação com retry automático
   */
  async executeTransaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.$transaction(fn);
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          this.logger.error(`Transação falhou após ${maxRetries} tentativas:`, error);
          throw error;
        }

        this.logger.warn(`Tentativa ${attempt} de transação falhou, tentando novamente...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Método para verificar a saúde da conexão
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: `${duration}ms`,
      };
    } catch (error) {
      this.logger.error('Erro no health check do banco:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Método para obter estatísticas de conexão
   */
  async getConnectionStats() {
    try {
      // Verificar conexões ativas (PostgreSQL)
      const result = await this.$queryRaw`
        SELECT 
          count(*) as active_connections,
          state,
          application_name
        FROM pg_stat_activity 
        WHERE state = 'active'
        GROUP BY state, application_name
      `;

      return {
        activeConnections: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de conexão:', error);
      return { error: error.message };
    }
  }
}
