import * as Transport from 'winston-transport';
import { EventService } from '../events/event.service';

export class WebSocketTransport extends Transport {
  private eventService: EventService;

  constructor(opts: any, eventService: EventService) {
    super(opts);
    this.eventService = eventService;
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Emitir evento via EventService (event-driven)
    this.eventService.emitLog({
      level: info.level as 'error' | 'warn' | 'info' | 'debug',
      message: info.message,
      module: info.context || info.module,
      clientId: info.clientId,
      metadata: {
        ...info,
        level: undefined,
        message: undefined,
        context: undefined,
        module: undefined,
        clientId: undefined,
      },
    });

    callback();
  }
}
