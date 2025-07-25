import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueProcessor } from './queue.processor';
import { TelegramModule } from '../notifications/telegram.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'default' }),
    forwardRef(() => TelegramModule),
  ],
  providers: [QueueService, QueueProcessor],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
