import { Module } from '@nestjs/common';
import { CustomersModule } from './customers/customers.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule, CustomersModule, CartModule, OrdersModule],
  exports: [CustomersModule, CartModule, OrdersModule],
})
export class EcommerceModule {}
