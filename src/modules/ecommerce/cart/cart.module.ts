import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { DatabaseModule } from '../../../database/database.module';
import { TenantModule } from '../../../common/tenant/tenant.module';

@Module({
  imports: [DatabaseModule, TenantModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
