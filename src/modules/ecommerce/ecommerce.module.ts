import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersModule } from './customers/customers.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    CustomersModule,
    CartModule,
    OrdersModule,
  ],
  exports: [CustomersModule, CartModule, OrdersModule],
})
export class EcommerceModule {}
