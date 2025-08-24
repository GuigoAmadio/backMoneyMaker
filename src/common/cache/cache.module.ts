import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheMetricsService } from './cache-metrics.service';
import { CacheController } from './cache.controller';
import { RedisService } from './redis.service';
// ✅ Novos imports para cache inteligente
import { CacheMetadataController } from '../../modules/cache/cache-metadata.controller';
import { CacheMetadataService } from '../../modules/cache/cache-metadata.service';
import { CacheEventsController } from '../../modules/cache/cache-events.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [
    CacheController,
    CacheMetadataController, // ✅ Cache metadata endpoints
    CacheEventsController, // ✅ SSE cache events
  ],
  providers: [
    CacheService,
    CacheMetricsService,
    RedisService,
    CacheMetadataService, // ✅ Cache metadata service
  ],
  exports: [
    CacheService,
    CacheMetricsService,
    RedisService,
    CacheMetadataService, // ✅ Export para uso em outros módulos
  ],
})
export class CacheModule {}
