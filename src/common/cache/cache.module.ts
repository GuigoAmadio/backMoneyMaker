import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheMetricsService } from './cache-metrics.service';
import { CacheController } from './cache.controller';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  controllers: [
    CacheController,
  ],
  providers: [
    CacheService,
    CacheMetricsService,
    RedisService,
  ],
  exports: [
    CacheService,
    CacheMetricsService,
    RedisService,
  ],
})
export class CacheModule {}
