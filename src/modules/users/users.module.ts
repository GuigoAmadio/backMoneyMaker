import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../../database/database.module';
import { TenantModule } from '../../common/tenant/tenant.module';
import { CacheModule } from '../../common/cache/cache.module';
import { TelegramService } from '../../common/notifications/telegram.service';

@Module({
  imports: [DatabaseModule, TenantModule, CacheModule],
  controllers: [UsersController],
  providers: [UsersService, TelegramService],
  exports: [UsersService],
})
export class UsersModule {}
