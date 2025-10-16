import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LogsService } from './logs.service';
import { EventService } from '../../common/events/event.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure apropriadamente para produção
  },
  namespace: '/api/v1/logs',
})
export class LogsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LogsGateway.name);

  constructor(
    private logsService: LogsService,
    private eventService: EventService,
  ) {}

  async onModuleInit() {
    // Escutar eventos de log
    this.eventService.on('log.created', (event) => {
      this.emitLogToClients(event.data);
    });

    // Escutar eventos HTTP
    this.eventService.on('http.request', (event) => {
      this.emitHttpEventToClients(event.data);
    });

    this.logger.log('🎧 LogsGateway escutando eventos do EventService');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado ao logs: ${client.id}`);

    // Enviar últimos logs ao conectar
    const recentLogs = this.logsService.getRecentLogs(50);
    client.emit('initialLogs', recentLogs);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado do logs: ${client.id}`);
  }

  @SubscribeMessage('subscribeToLogs')
  handleSubscribe(
    @MessageBody() data: { level?: string; module?: string; clientId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📡 Cliente inscrito nos logs: ${client.id}`, data);

    // Armazenar filtros do cliente
    client.data.filters = data;

    return {
      event: 'subscriptionConfirmed',
      data: { message: 'Inscrito nos logs com sucesso', filters: data },
    };
  }

  // Método para emitir logs para todos os clientes conectados
  private emitLogToClients(logData: any) {
    try {
      // Verificar se o servidor está disponível
      if (!this.server) {
        this.logger.warn('WebSocket server não está disponível para emitir logs');
        return;
      }

      // Criar log entry formatado
      const logEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level: logData.level,
        message: logData.message,
        module: logData.module,
        clientId: logData.clientId,
        metadata: logData.metadata,
      };

      // Armazenar no serviço
      this.logsService.addLog(logEntry);

      // Emitir para todos os clientes conectados no namespace
      this.server.emit('newLog', logEntry);
    } catch (error) {
      this.logger.error('Erro ao emitir log via WebSocket:', error);
    }
  }

  // Método para emitir eventos HTTP para todos os clientes conectados
  private emitHttpEventToClients(httpData: any) {
    try {
      // Verificar se o servidor está disponível
      if (!this.server) {
        return;
      }

      // Criar log entry formatado para HTTP
      const logEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level: httpData.statusCode >= 400 ? 'error' : httpData.statusCode >= 300 ? 'warn' : 'info',
        message: `${httpData.method} ${httpData.url} ${httpData.statusCode} - ${httpData.duration}ms`,
        module: 'HTTP',
        clientId: httpData.clientId,
        metadata: {
          method: httpData.method,
          url: httpData.url,
          statusCode: httpData.statusCode,
          duration: `${httpData.duration}ms`,
          responseSize: httpData.responseSize,
          userId: httpData.userId,
        },
      };

      // Armazenar no serviço
      this.logsService.addLog(logEntry);

      // Emitir para todos os clientes conectados no namespace
      this.server.emit('newLog', logEntry);
    } catch (error) {
      this.logger.error('Erro ao emitir evento HTTP via WebSocket:', error);
    }
  }
}
