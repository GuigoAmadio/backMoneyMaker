import { Controller, Sse, UseGuards, Request, MessageEvent } from '@nestjs/common';
import { Observable, interval, fromEvent } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { EventEmitter } from 'events';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

// EventEmitter global para comunicação entre serviços
export const cacheEventEmitter = new EventEmitter();

interface CacheEvent {
  type: 'invalidate' | 'invalidate_type' | 'update' | 'delete';
  pattern: string;
  clientId: string;
  timestamp: string;
  metadata?: any;
}

@Controller('cache-events')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CacheEventsController {
  /**
   * ✅ Stream SSE para atualizações de cache em tempo real
   */
  @Sse('stream')
  streamCacheEvents(@Request() req: any): Observable<MessageEvent> {
    const clientId = req.clientId;

    if (!clientId) {
      console.error('❌ [SSE] Client ID não encontrado na requisição');
      throw new Error('Client ID não encontrado');
    }

    console.log(`🔌 [SSE] Cliente ${clientId} conectado para cache events`);
    console.log(`📡 [SSE] Iniciando stream de eventos para clientId: ${clientId}`);

    // Retornar Observable que escuta eventos de cache
    return new Observable((subscriber) => {
      // Heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          }),
        } as MessageEvent);
      }, 30000); // A cada 30 segundos

      // Escutar eventos específicos do cliente
      const handleCacheEvent = (event: CacheEvent) => {
        // Filtrar apenas eventos do cliente atual
        if (event.clientId === clientId) {
          console.log(`📡 [SSE] Enviando evento para cliente ${clientId}:`);
          console.log(
            `📋 [SSE] Evento: type=${event.type}, pattern=${event.pattern}, timestamp=${event.timestamp}`,
          );

          subscriber.next({
            type: 'cache-event',
            data: JSON.stringify({
              type: event.type,
              pattern: event.pattern,
              timestamp: event.timestamp,
              metadata: event.metadata,
            }),
          } as MessageEvent);

          console.log(`✅ [SSE] Evento enviado com sucesso para cliente ${clientId}`);
        } else {
          console.log(`🔇 [SSE] Evento ignorado - clientId ${event.clientId} ≠ ${clientId}`);
        }
      };

      // Registrar listener
      cacheEventEmitter.on('cache-invalidate', handleCacheEvent);
      cacheEventEmitter.on('cache-update', handleCacheEvent);

      // Cleanup ao desconectar
      return () => {
        console.log(`❌ [SSE] Cliente ${clientId} desconectado`);
        console.log(`🧹 [SSE] Limpando listeners e heartbeat para cliente ${clientId}`);
        clearInterval(heartbeat);
        cacheEventEmitter.off('cache-invalidate', handleCacheEvent);
        cacheEventEmitter.off('cache-update', handleCacheEvent);
        console.log(`✅ [SSE] Cleanup concluído para cliente ${clientId}`);
      };
    });
  }

  /**
   * ✅ Emitir evento de cache (para ser usado por outros serviços)
   */
  static emitCacheEvent(event: Omit<CacheEvent, 'timestamp'>) {
    const fullEvent: CacheEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    console.log(`🚀 [SSE] Emitindo evento de cache:`);
    console.log(
      `📋 [SSE] clientId: ${fullEvent.clientId}, type: ${fullEvent.type}, pattern: ${fullEvent.pattern}`,
    );
    console.log(`🏷️ [SSE] metadata:`, fullEvent.metadata);

    // Emitir evento baseado no tipo
    if (event.type === 'invalidate' || event.type === 'invalidate_type') {
      cacheEventEmitter.emit('cache-invalidate', fullEvent);
      console.log(`✅ [SSE] Evento 'cache-invalidate' emitido`);
    } else {
      cacheEventEmitter.emit('cache-update', fullEvent);
      console.log(`✅ [SSE] Evento 'cache-update' emitido`);
    }
  }

  /**
   * ✅ Helper para invalidar cache de employees
   */
  static invalidateEmployeesCache(clientId: string, employeeId?: string) {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern: employeeId ? `employees:${employeeId}` : 'employees',
      clientId,
      metadata: { reason: 'employee_updated' },
    });
  }

  /**
   * ✅ Helper para invalidar cache de appointments
   */
  static invalidateAppointmentsCache(clientId: string, date?: string) {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern: date ? `appointments:${date}` : 'appointments',
      clientId,
      metadata: { reason: 'appointment_updated' },
    });
  }

  /**
   * ✅ Helper para invalidar cache de services
   */
  static invalidateServicesCache(clientId: string, serviceId?: string) {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern: serviceId ? `services:${serviceId}` : 'services',
      clientId,
      metadata: { reason: 'service_updated' },
    });
  }

  /**
   * ✅ Helper para invalidar cache de clients
   */
  static invalidateClientsCache(clientId: string, userId?: string) {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern: userId ? `clients:${userId}` : 'clients',
      clientId,
      metadata: { reason: 'client_updated' },
    });
  }

  /**
   * ✅ Helper para invalidar cache de dashboard
   */
  static invalidateDashboardCache(clientId: string) {
    this.emitCacheEvent({
      type: 'invalidate_type',
      pattern: 'dashboard',
      clientId,
      metadata: { reason: 'dashboard_data_changed' },
    });
  }

  /**
   * ✅ Helper genérico para invalidar qualquer cache
   */
  static invalidateGenericCache(clientId: string, pattern: string, reason?: string) {
    this.emitCacheEvent({
      type: 'invalidate',
      pattern,
      clientId,
      metadata: { reason: reason || 'generic_update' },
    });
  }
}
