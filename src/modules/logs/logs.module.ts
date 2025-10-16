import { Module, Global } from '@nestjs/common';
import { LogsGateway } from './logs.gateway';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { LogsEmitterService } from './logs-emitter.service';

@Global() // Tornar global para poder usar em qualquer lugar
@Module({
  controllers: [LogsController],
  providers: [LogsGateway, LogsService, LogsEmitterService],
  exports: [LogsService, LogsGateway, LogsEmitterService],
})
export class LogsModule {}
