import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DatabaseModule } from '../../../database/database.module';
import { TenantModule } from '../../../common/tenant/tenant.module';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
