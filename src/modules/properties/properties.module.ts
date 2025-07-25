import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
