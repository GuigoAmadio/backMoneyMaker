import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [ConfigModule, forwardRef(() => QueueModule)],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
