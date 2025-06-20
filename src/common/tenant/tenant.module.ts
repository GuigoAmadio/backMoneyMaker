import { Module } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';
import { TenantService } from './tenant.service';

@Module({
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {
  configure(consumer: any) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
} 