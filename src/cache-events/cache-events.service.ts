import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';

export interface CacheEvent {
  type: 'invalidate' | 'invalidate_type' | 'update' | 'delete';
  pattern: string;
  timestamp: string;
  clientId: string;
  metadata?: any;
}

@Injectable()
export class CacheEventsService {
  private readonly logger = new Logger(CacheEventsService.name);
  private cacheEventsSubject = new Subject<CacheEvent>();

  // Emitir evento de cache
  emitCacheEvent(event: CacheEvent): void {
    this.logger.log(`📡 [CacheEvents] Emitindo evento: ${event.type} - ${event.pattern}`);
    this.cacheEventsSubject.next(event);
  }

  // Obter stream de eventos de cache para um cliente específico
  getCacheUpdatesStream(clientId: string): Observable<CacheEvent> {
    return this.cacheEventsSubject.pipe(
      filter((event) => event.clientId === clientId),
      map((event) => ({
        ...event,
        timestamp: new Date().toISOString(),
      })),
    );
  }

  // Invalidar cache por padrão
  invalidateCachePattern(clientId: string, pattern: string, metadata?: any): void {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern,
      clientId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  // Invalidar cache por tipo
  invalidateCacheType(clientId: string, type: string, metadata?: any): void {
    this.emitCacheEvent({
      type: 'invalidate_type',
      pattern: type,
      clientId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  // Atualizar cache
  updateCache(clientId: string, pattern: string, metadata?: any): void {
    this.emitCacheEvent({
      type: 'update',
      pattern,
      clientId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  // Deletar do cache
  deleteFromCache(clientId: string, pattern: string, metadata?: any): void {
    this.emitCacheEvent({
      type: 'delete',
      pattern,
      clientId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }
}
