import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';
import { CacheEventsModule } from '../../cache-events/cache-events.module';
import { TelegramService } from '../../common/notifications/telegram.service';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule, CacheEventsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, TelegramService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
