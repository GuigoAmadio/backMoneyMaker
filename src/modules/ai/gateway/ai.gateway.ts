import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AIService } from '../services/ai.service';
import { ChatMessageDto } from '../dto/chat-message.dto';

/**
 * AI Gateway
 *
 * WebSocket gateway for real-time AI chat communication
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/ai',
  transports: ['websocket'], // se estiver usando adapter compatível
})
export class AIGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AIGateway.name);
  private connectedClients = new Map<string, { userId: string; clientId: string }>();

  constructor(private readonly aiService: AIService) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Get user info from handshake (assuming JWT auth)
      const userId = client.handshake.auth?.userId || client.handshake.query?.userId;
      const clientId = client.handshake.auth?.clientId || client.handshake.query?.clientId;

      if (!userId || !clientId) {
        this.logger.warn(`Client ${client.id} connected without auth info`);
        client.emit('chat:error', { message: 'Faltam credenciais (userId/clientId)' });
        client.disconnect(true);
        return;
      }

      this.connectedClients.set(client.id, {
        userId: userId as string,
        clientId: clientId as string,
      });
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Send welcome message
      client.emit('connected', {
        message: 'Conectado ao assistente de IA',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.emit('chat:error', { message: 'Falha na conexão', error: error.message });
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Handle chat message from client
   */
  @SubscribeMessage('chat:message')
  async handleChatMessage(@MessageBody() data: ChatMessageDto, @ConnectedSocket() client: Socket) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (!clientInfo) {
        client.emit('chat:error', { message: 'Cliente não autenticado' });
        return;
      }

      this.logger.log(`📨 Processing message from ${clientInfo.userId}: ${data.message}`);
      this.logger.debug(`📨 Message data: ${JSON.stringify(data)}`);

      // Show typing indicator
      client.emit('chat:typing', { isTyping: true });

      // Process message with AI service
      const response = await this.aiService.processMessage(
        data,
        clientInfo.userId,
        clientInfo.clientId,
      );

      this.logger.debug(`📤 Gateway sending response: ${JSON.stringify(response)}`);

      // Stop typing indicator
      client.emit('chat:typing', { isTyping: false });

      // Send response
      client.emit('chat:response', response);

      this.logger.log(`✅ Response sent to ${clientInfo.userId}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`);
      client.emit('chat:error', {
        message: 'Erro ao processar mensagem',
        error: error.message,
      });
    }
  }

  /**
   * Handle conversation clear request
   */
  @SubscribeMessage('chat:clear')
  async handleClearConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.aiService.clearConversation(data.conversationId);
      client.emit('chat:cleared', {
        message: 'Conversa limpa',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error clearing conversation: ${error.message}`);
      client.emit('chat:error', {
        message: 'Erro ao limpar conversa',
        error: error.message,
      });
    }
  }

  /**
   * Send notification to specific client
   */
  sendNotification(userId: string, notification: any) {
    // Find all sockets for this user
    this.connectedClients.forEach((clientInfo, socketId) => {
      if (clientInfo.userId === userId) {
        this.server.to(socketId).emit('notification', notification);
      }
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToClient(clientId: string, event: string, data: any) {
    this.connectedClients.forEach((clientInfo, socketId) => {
      if (clientInfo.clientId === clientId) {
        this.server.to(socketId).emit(event, data);
      }
    });
  }
}
