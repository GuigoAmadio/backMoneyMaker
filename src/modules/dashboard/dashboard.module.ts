import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
