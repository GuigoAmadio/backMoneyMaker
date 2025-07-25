import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw new HealthCheckError('Database check failed', {
        database: { status: 'down', error: error.message },
      });
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      await this.cacheService.set('health-check', 'ok', undefined, { ttl: 10 });
      const value = await this.cacheService.get('health-check');
      const responseTime = Date.now() - startTime;

      return {
        redis: {
          status: 'up',
          responseTime: `${responseTime}ms`,
          value: value === 'ok' ? 'connected' : 'error',
        },
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      throw new HealthCheckError('Redis check failed', {
        redis: { status: 'down', error: error.message },
      });
    }
  }

  async checkServerHealth(): Promise<HealthIndicatorResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      return {
        server: {
          status: 'up',
          memoryUsage: `${memoryPercent.toFixed(1)}%`,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      this.logger.error('Server health check failed:', error);
      throw new HealthCheckError('Server check failed', {
        server: { status: 'down', error: error.message },
      });
    }
  }

  async getDetailedHealth() {
    const [dbHealth, redisHealth, serverHealth] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkServerHealth(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database:
          dbHealth.status === 'fulfilled'
            ? dbHealth.value
            : { status: 'error', error: dbHealth.reason },
        redis:
          redisHealth.status === 'fulfilled'
            ? redisHealth.value
            : { status: 'error', error: redisHealth.reason },
        server:
          serverHealth.status === 'fulfilled'
            ? serverHealth.value
            : { status: 'error', error: serverHealth.reason },
      },
    };
  }

  async getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
