import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto } from '../dtos/send-message.dto';
import {
  WhatsAppMessage,
  MessageDirection,
  MessageStatus,
} from '../../domain/entities/whatsapp-message.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';
import { IWhatsAppMessageRepository } from '../../domain/repositories/whatsapp-message.repository.interface';
import { IWhatsAppApiClient } from '../../infrastructure/whatsapp-api/whatsapp-api-client.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use Case: Send Message
 * Envia uma mensagem via WhatsApp API
 */
@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    private readonly messageRepository: IWhatsAppMessageRepository,
    private readonly whatsappApiClient: IWhatsAppApiClient,
  ) {}

  async execute(
    dto: SendMessageDto,
    fromNumber: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.logger.log(`📤 Enviando mensagem para ${dto.to}`);

      // 1. Criar Value Objects
      const from = PhoneNumber.create(fromNumber);
      const to = PhoneNumber.create(dto.to);
      const content = MessageContent.create(dto.content);

      // 2. Criar Entity
      const message = WhatsAppMessage.create({
        id: uuidv4(),
        from,
        to,
        content,
        direction: MessageDirection.OUTGOING,
        conversationId: dto.conversationId,
        replyToMessageId: dto.replyToMessageId,
      });

      // 3. Enviar via API
      const apiResult = await this.whatsappApiClient.sendMessage({
        to: to.toWhatsAppFormat(),
        message: content.getValue(),
        replyToMessageId: dto.replyToMessageId,
      });

      if (!apiResult.success) {
        message.markAsFailed();
        await this.messageRepository.save(message);

        this.logger.error(`❌ Falha ao enviar mensagem: ${apiResult.error}`);
        return {
          success: false,
          error: apiResult.error,
        };
      }

      // 4. Marcar como enviada
      message.markAsSent();

      // 5. Persistir
      await this.messageRepository.save(message);

      this.logger.log(`✅ Mensagem enviada: ${message.getId()}`);

      return {
        success: true,
        messageId: message.getId(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
