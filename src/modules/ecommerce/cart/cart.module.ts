import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { DatabaseModule } from '../../../database/database.module';
import { CacheModule } from '../../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
