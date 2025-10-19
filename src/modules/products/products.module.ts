import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

// ==================== Presentation Layer ====================
import { ProductsController } from './products.controller';

// ==================== C++ Native Service ====================
import { ProductsNativeService } from './products-native.service';

// ==================== Legacy Service (temporário) ====================
import { ProductsService } from './products.service';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule, EventEmitterModule.forRoot()],
  controllers: [ProductsController],
  providers: [
    // ==================== C++ Native ====================
    ProductsNativeService,
  ],
  exports: [
    ProductsNativeService, // Exporta C++ Native Service
  ],
})
export class ProductsModule {}
