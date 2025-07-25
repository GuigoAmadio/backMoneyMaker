import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TerminusModule, DatabaseModule, CacheModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
