import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from './event.service';

@Global() // Disponível em todo o sistema
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Configurações do EventEmitter2
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 100,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
