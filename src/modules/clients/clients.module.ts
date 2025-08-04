import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from '../../database/prisma.service';
import { TelegramService } from '../../common/notifications/telegram.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, PrismaService, TelegramService],
  exports: [ClientsService],
})
export class ClientsModule {}
