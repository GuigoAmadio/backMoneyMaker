import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, filter, map, interval, of, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface CacheEvent {
  type: 'invalidate' | 'invalidate_type' | 'update' | 'delete' | 'heartbeat';
  pattern: string;
  timestamp: string;
  metadata?: any;
  clientId?: string;
}

interface SSEClient {
  id: string;
  tenantClientId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  eventStream: Subject<CacheEvent>;
}

@Injectable()
export class CacheEventsService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheEventsService.name);
  private cacheEventsSubject = new Subject<CacheEvent>();
  private clients: Map<string, SSEClient> = new Map();
  private clientCounter = 0;
  private destroy$ = new Subject<void>();

  constructor() {
    // Limpar clientes inativos a cada 5 minutos
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cleanupInactiveClients());
  }

  // Emitir evento de cache
  emitCacheEvent(event: CacheEvent) {
    this.logger.log(`📡 [CacheEvents] Emitindo evento: ${event.type} - ${event.pattern}`);
    this.cacheEventsSubject.next(event);
  }

  // Adicionar cliente
  addClient(tenantClientId: string, userId: string): string {
    const clientId = `client_${++this.clientCounter}`;

    const client: SSEClient = {
      id: clientId,
      tenantClientId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      eventStream: new Subject<CacheEvent>(),
    };

    this.clients.set(clientId, client);
    this.logger.log(
      `✅ [SSE] Cliente conectado: ${clientId} (User: ${userId}, Tenant: ${tenantClientId})`,
    );

    return clientId;
  }

  // Remover cliente
  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.eventStream.complete();
      this.clients.delete(clientId);
      this.logger.log(`❌ [SSE] Cliente desconectado: ${clientId}`);
    }
  }

  // Obter stream de eventos para um cliente
  getEventStream(clientId: string): Observable<MessageEvent> {
    const client = this.clients.get(clientId);
    if (!client) {
      return of({
        data: JSON.stringify({
          type: 'error',
          message: 'Cliente não encontrado',
          timestamp: new Date().toISOString(),
        }),
      } as MessageEvent);
    }

    return client.eventStream.pipe(
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
          }) as MessageEvent,
      ),
    );
  }

  // Obter stream de eventos por tipo
  getEventStreamByType(tenantClientId: string, type: string): Observable<MessageEvent> {
    return this.cacheEventsSubject.pipe(
      filter((event) => event.type === type),
      map(
        (event) =>
          ({
            data: JSON.stringify(event),
          }) as MessageEvent,
      ),
    );
  }

  // Enviar evento para um tenant específico
  broadcastToTenant(tenantClientId: string, event: Omit<CacheEvent, 'clientId'>) {
    const eventWithClient: CacheEvent = {
      ...event,
      clientId: tenantClientId,
    };

    this.clients.forEach((client, clientId) => {
      if (client.tenantClientId === tenantClientId) {
        try {
          client.eventStream.next(eventWithClient);
          client.lastActivity = new Date();
        } catch (error) {
          this.logger.error(`❌ [SSE] Erro ao enviar para cliente ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    });

    this.logger.log(`📡 [SSE] Evento enviado para tenant ${tenantClientId}: ${event.type}`);
  }

  // Enviar evento para um usuário específico
  sendToUser(userId: string, event: Omit<CacheEvent, 'clientId'>) {
    const eventWithClient: CacheEvent = {
      ...event,
      clientId: 'user_specific',
    };

    this.clients.forEach((client, clientId) => {
      if (client.userId === userId) {
        try {
          client.eventStream.next(eventWithClient);
          client.lastActivity = new Date();
        } catch (error) {
          this.logger.error(`❌ [SSE] Erro ao enviar para usuário ${userId}:`, error);
          this.removeClient(clientId);
        }
      }
    });

    this.logger.log(`📡 [SSE] Evento enviado para usuário ${userId}: ${event.type}`);
  }

  // Limpar clientes inativos
  private cleanupInactiveClients() {
    const now = new Date();
    const timeout = 10 * 60 * 1000; // 10 minutos

    this.clients.forEach((client, clientId) => {
      if (now.getTime() - client.lastActivity.getTime() > timeout) {
        this.logger.log(`🧹 [SSE] Limpando cliente inativo: ${clientId}`);
        this.removeClient(clientId);
      }
    });
  }

  // Obter estatísticas
  getStats() {
    const now = new Date();
    const activeClients = Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      tenantClientId: client.tenantClientId,
      userId: client.userId,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      uptime: now.getTime() - client.connectedAt.getTime(),
    }));

    return {
      totalClients: this.clients.size,
      activeClients,
      totalEvents: this.cacheEventsSubject.observers.length,
    };
  }

  // ✅ Obter informações de um cliente específico
  getClientInfo(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) {
      return { error: 'Cliente não encontrado' };
    }

    const now = new Date();
    return {
      id: client.id,
      tenantClientId: client.tenantClientId,
      userId: client.userId,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      uptime: now.getTime() - client.connectedAt.getTime(),
      isActive: now.getTime() - client.lastActivity.getTime() < 10 * 60 * 1000, // 10 minutos
    };
  }

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpar todos os clientes
    this.clients.forEach((client, clientId) => {
      this.removeClient(clientId);
    });
  }
}
