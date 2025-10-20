import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IWhatsAppMessageRepository } from '../../domain/repositories/whatsapp-message.repository.interface';
import {
  WhatsAppMessage,
  MessageDirection,
  MessageStatus,
} from '../../domain/entities/whatsapp-message.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';

/**
 * Implementação: WhatsAppMessageRepository
 * Persistência de mensagens usando Prisma
 */
@Injectable()
export class WhatsAppMessageRepository implements IWhatsAppMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Métodos upsert do Prisma fazem "update ou insert":
   * - Se existir um registro com o 'where', faz UPDATE nos campos definidos em 'update'
   * - Se não existir, faz INSERT com os valores de 'create'
   * Dessa forma, podemos garantir que a mensagem é salva caso novo, ou atualizada caso já exista.
   */
  async save(message: WhatsAppMessage): Promise<void> {
    await this.prisma.whatsAppMessage.upsert({
      where: { id: message.getId() },
      create: {
        id: message.getId(),
        from: message.getFrom().toWhatsAppFormat(),
        to: message.getTo().toWhatsAppFormat(),
        content: message.getContent().getValue(),
        direction: message.getDirection(),
        status: message.getStatus(),
        timestamp: message.getTimestamp(),
        conversationId: message.getConversationId(),
      },
      update: {
        status: message.getStatus(),
      },
    });
  }

  async findById(id: string): Promise<WhatsAppMessage | null> {
    const data = await this.prisma.whatsAppMessage.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByConversationId(
    conversationId: string,
    limit: number = 50,
  ): Promise<WhatsAppMessage[]> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return messages.map((m) => this.toDomain(m));
  }

  async findBetweenNumbers(
    from: PhoneNumber,
    to: PhoneNumber,
    limit: number = 50,
  ): Promise<WhatsAppMessage[]> {
    const fromStr = from.toWhatsAppFormat();
    const toStr = to.toWhatsAppFormat();

    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        OR: [
          { from: fromStr, to: toStr },
          { from: toStr, to: fromStr },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return messages.map((m) => this.toDomain(m));
  }

  async findByPhoneNumber(
    phoneNumber: PhoneNumber,
    limit: number = 50,
  ): Promise<WhatsAppMessage[]> {
    const phone = phoneNumber.toWhatsAppFormat();

    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        OR: [{ from: phone }, { to: phone }],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return messages.map((m) => this.toDomain(m));
  }

  async countUnreadMessages(phoneNumber: PhoneNumber): Promise<number> {
    const phone = phoneNumber.toWhatsAppFormat();

    return this.prisma.whatsAppMessage.count({
      where: {
        to: phone,
        direction: MessageDirection.INCOMING,
        status: {
          not: MessageStatus.READ,
        },
      },
    });
  }

  async updateStatus(messageId: string, status: string): Promise<void> {
    await this.prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: { status },
    });
  }

  /**
   * Converte modelo Prisma para Entity de domínio
   */
  private toDomain(data: any): WhatsAppMessage {
    return WhatsAppMessage.create({
      id: data.id,
      from: PhoneNumber.create(data.from),
      to: PhoneNumber.create(data.to),
      content: MessageContent.create(data.content),
      direction: data.direction as MessageDirection,
      conversationId: data.conversationId,
      replyToMessageId: data.replyToMessageId,
    });
  }
}
