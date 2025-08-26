import { Controller, Logger, Req, Sse, Get, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, interval, of, EMPTY, switchMap } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { CacheEventsService } from './cache-events.service';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Cache Events')
@Controller('cache-events')
export class CacheEventsController {
  private readonly logger = new Logger(CacheEventsController.name);

  constructor(
    private readonly cacheEventsService: CacheEventsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('test')
  testEndpoint() {
    this.logger.log('✅ [CacheEvents] Endpoint de teste acessado');
    return { message: 'Cache Events endpoint working!', timestamp: new Date().toISOString() };
  }

  @Sse('stream')
  streamCacheEvents(
    @Query('token') queryToken: string,
    @Headers('cookie') cookies: string,
  ): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de cache events`);

    // Extrair token de cookies ou query parameter
    let token = queryToken;

    if (!token && cookies) {
      const cookieToken = this.extractTokenFromCookies(cookies);
      if (cookieToken) {
        token = cookieToken;
        this.logger.log(`🍪 [SSE] Token extraído de cookies`);
      }
    }

    // Validar token se fornecido
    let tenantClientId: string | undefined;
    let userId: string | undefined;

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        tenantClientId = decoded.clientId;
        userId = decoded.sub;
        this.logger.log(`✅ [SSE] Token válido para usuário: ${decoded.email}`);
      } catch (error) {
        this.logger.error('❌ [SSE] Token inválido:', error.message);
        return EMPTY;
      }
    } else {
      this.logger.warn('⚠️ [SSE] Nenhum token fornecido, usando clientId padrão');
      tenantClientId = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8'; // Client ID padrão
      userId = 'anonymous';
    }

    if (!tenantClientId) {
      this.logger.error('❌ [SSE] Client ID não identificado');
      return EMPTY;
    }

    // Registrar cliente para receber eventos
    const clientId = this.cacheEventsService.addClient(tenantClientId, userId);

    // Retornar stream de eventos de cache
    return this.cacheEventsService.getEventStream(clientId).pipe(
      // Adicionar heartbeat a cada 30 segundos
      switchMap(() =>
        interval(30000).pipe(
          switchMap(() =>
            of({
              data: JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                clientId: tenantClientId,
              }),
            } as MessageEvent),
          ),
        ),
      ),
    );
  }

  @Sse('updates/:type')
  streamCacheUpdates(
    @Query('token') queryToken: string,
    @Headers('cookie') cookies: string,
    @Param('type') type: string,
  ): Observable<MessageEvent> {
    this.logger.log(`📡 [SSE] Nova conexão de updates, tipo: ${type}`);

    // Extrair token de cookies ou query parameter
    let token = queryToken;

    if (!token && cookies) {
      const cookieToken = this.extractTokenFromCookies(cookies);
      if (cookieToken) {
        token = cookieToken;
        this.logger.log(`🍪 [SSE] Token extraído de cookies para updates`);
      }
    }

    let tenantClientId: string | undefined;

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        tenantClientId = decoded.clientId;
      } catch (error) {
        this.logger.error('❌ [SSE] Token inválido para updates:', error.message);
        return EMPTY;
      }
    } else {
      tenantClientId = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8'; // Client ID padrão
    }

    if (!tenantClientId) {
      this.logger.error('❌ [SSE] Cliente não identificado');
      return EMPTY;
    }

    // Retornar stream de eventos específicos por tipo
    return this.cacheEventsService.getEventStreamByType(tenantClientId, type);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de conexões SSE' })
  getSSEStats() {
    return this.cacheEventsService.getStats();
  }

  /**
   * Extrai o token JWT dos cookies HTTP
   */
  private extractTokenFromCookies(cookies: string): string | null {
    if (!cookies) return null;

    const cookiePairs = cookies.split(';');
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name === 'auth_token' && value) {
        return value;
      }
    }
    return null;
  }
}
