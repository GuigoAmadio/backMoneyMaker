import {
  Controller,
  Logger,
  Req,
  Sse,
  Get,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, interval, of, EMPTY, switchMap } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { CacheEventsService } from './cache-events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Cache Events')
@Controller({ path: 'cache-events', version: '1' })
@UseGuards(JwtAuthGuard)
export class CacheEventsController {
  private readonly logger = new Logger(CacheEventsController.name);

  constructor(private readonly cacheEventsService: CacheEventsService) {}

  @Get('test')
  testEndpoint() {
    this.logger.log('✅ [CacheEvents] Endpoint de teste acessado');
    return { message: 'Cache Events endpoint working!', timestamp: new Date().toISOString() };
  }

  @Sse('stream')
  streamCacheEvents(@Req() request: any): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de cache events`);

    // ✅ O JwtAuthGuard já validou o token e extraiu o usuário
    const user = request.user;
    const tenantClientId = user.clientId;
    const userId = user.id;
    const userEmail = user.email;

    this.logger.log(`✅ [SSE] Usuário autenticado: ${userEmail}`);
    this.logger.log(`🏢 [SSE] Tenant Client ID: ${tenantClientId}`);

    if (!tenantClientId) {
      this.logger.error('❌ [SSE] Client ID não encontrado no JWT');
      return EMPTY;
    }

    // ✅ Registrar cliente para receber eventos
    const sseClientId = this.cacheEventsService.addClient(tenantClientId, userId);
    this.logger.log(`✅ [SSE] Cliente registrado: ${sseClientId} para tenant: ${tenantClientId}`);

    // ✅ Retornar stream de eventos de cache
    return this.cacheEventsService.getEventStream(sseClientId).pipe(
      // ✅ Adicionar heartbeat a cada 30 segundos
      switchMap(() =>
        interval(30000).pipe(
          switchMap(() =>
            of({
              data: JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                clientId: tenantClientId,
                userId: userId,
              }),
            } as MessageEvent),
          ),
        ),
      ),
    );
  }

  @Sse('updates/:type')
  streamCacheUpdates(@Req() request: any, @Param('type') type: string): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de updates, tipo: ${type}`);

    // ✅ O JwtAuthGuard já validou o token e extraiu o usuário
    const user = request.user;
    const tenantClientId = user.clientId;

    this.logger.log(`✅ [SSE] Usuário autenticado para updates: ${user.email}`);
    this.logger.log(`🏢 [SSE] Tenant Client ID: ${tenantClientId}`);

    if (!tenantClientId) {
      this.logger.error('❌ [SSE] Client ID não encontrado no JWT para updates');
      return EMPTY;
    }

    // ✅ Retornar stream de eventos específicos por tipo
    return this.cacheEventsService.getEventStreamByType(tenantClientId, type);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de conexões SSE' })
  getSSEStats() {
    return this.cacheEventsService.getStats();
  }

  @Get('clients/:clientId')
  @ApiOperation({ summary: 'Obter informações de um cliente específico' })
  getClientInfo(@Param('clientId') clientId: string) {
    return this.cacheEventsService.getClientInfo(clientId);
  }
}
