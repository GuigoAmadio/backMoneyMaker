import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
