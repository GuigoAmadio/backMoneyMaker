import { Controller, Sse, MessageEvent, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, interval, map, switchMap, of, EMPTY } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { CacheEventsService } from './cache-events.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    clientId: string;
  };
}

@ApiTags('Cache Events')
@Controller('cache-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CacheEventsController {
  private readonly logger = new Logger(CacheEventsController.name);

  constructor(private readonly cacheEventsService: CacheEventsService) {}

  @Sse('stream')
  streamCacheEvents(@Req() req: AuthenticatedRequest): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de cache events para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId;
    const userId = req.user?.sub;

    if (!clientId || !userId) {
      this.logger.error('❌ [SSE] Cliente ou usuário não identificado');
      return EMPTY;
    }

    // Retornar stream de eventos de cache
    return interval(30000).pipe(
      switchMap(() => {
        // Heartbeat a cada 30 segundos
        return of({
          data: JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            clientId,
          }),
        } as MessageEvent);
      }),
    );
  }

  @Sse('updates/:type')
  streamCacheUpdates(@Req() req: AuthenticatedRequest): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de updates para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId;

    if (!clientId) {
      this.logger.error('❌ [SSE] Cliente não identificado');
      return EMPTY;
    }

    // Stream de eventos específicos de cache
    return this.cacheEventsService.getCacheUpdatesStream(clientId).pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
          }) as MessageEvent,
      ),
    );
  }
}
