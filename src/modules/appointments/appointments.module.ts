import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
