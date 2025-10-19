import { PhoneNumber } from '../value-objects/phone-number.vo';
import { MessageContent } from '../value-objects/message-content.vo';

/**
 * Entity: WhatsAppMessage (Aggregate Root)
 * Representa uma mensagem do WhatsApp com comportamento e regras de negócio
 */
export enum MessageDirection {
  INCOMING = 'INCOMING', // Recebida do cliente
  OUTGOING = 'OUTGOING', // Enviada para o cliente
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export class WhatsAppMessage {
  private domainEvents: string[] = [];

  private constructor(
    private readonly id: string,
    private readonly from: PhoneNumber,
    private readonly to: PhoneNumber,
    private readonly content: MessageContent,
    private readonly direction: MessageDirection,
    private status: MessageStatus,
    private readonly timestamp: Date,
    private readonly conversationId?: string,
    private readonly replyToMessageId?: string,
  ) {}

  static create(data: {
    id: string;
    from: PhoneNumber;
    to: PhoneNumber;
    content: MessageContent;
    direction: MessageDirection;
    conversationId?: string;
    replyToMessageId?: string;
  }): WhatsAppMessage {
    const message = new WhatsAppMessage(
      data.id,
      data.from,
      data.to,
      data.content,
      data.direction,
      MessageStatus.PENDING,
      new Date(),
      data.conversationId,
      data.replyToMessageId,
    );

    // Domain Event: MessageCreated
    message.addDomainEvent('MessageCreatedEvent');

    return message;
  }

  // ==================== Getters ====================

  getId(): string {
    return this.id;
  }

  getFrom(): PhoneNumber {
    return this.from;
  }

  getTo(): PhoneNumber {
    return this.to;
  }

  getContent(): MessageContent {
    return this.content;
  }

  getDirection(): MessageDirection {
    return this.direction;
  }

  getStatus(): MessageStatus {
    return this.status;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
  }

  getDomainEvents(): string[] {
    return this.domainEvents;
  }

  // ==================== Business Logic ====================

  isIncoming(): boolean {
    return this.direction === MessageDirection.INCOMING;
  }

  isOutgoing(): boolean {
    return this.direction === MessageDirection.OUTGOING;
  }

  isCommand(): boolean {
    return this.content.containsCommand();
  }

  markAsSent(): void {
    if (this.status !== MessageStatus.PENDING) {
      throw new Error('Apenas mensagens pendentes podem ser marcadas como enviadas');
    }

    this.status = MessageStatus.SENT;
    this.addDomainEvent('MessageSentEvent');
  }

  markAsDelivered(): void {
    if (this.status !== MessageStatus.SENT) {
      throw new Error('Apenas mensagens enviadas podem ser marcadas como entregues');
    }

    this.status = MessageStatus.DELIVERED;
    this.addDomainEvent('MessageDeliveredEvent');
  }

  markAsRead(): void {
    if (this.status !== MessageStatus.DELIVERED) {
      throw new Error('Apenas mensagens entregues podem ser marcadas como lidas');
    }

    this.status = MessageStatus.READ;
    this.addDomainEvent('MessageReadEvent');
  }

  markAsFailed(): void {
    this.status = MessageStatus.FAILED;
    this.addDomainEvent('MessageFailedEvent');
  }

  private addDomainEvent(event: string): void {
    this.domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
