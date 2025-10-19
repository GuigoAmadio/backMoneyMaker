import { WhatsAppMessage } from '../entities/whatsapp-message.entity';
import { PhoneNumber } from '../value-objects/phone-number.vo';

/**
 * Repository Interface: IWhatsAppMessageRepository
 * Define o contrato para persistência de mensagens
 */
export interface IWhatsAppMessageRepository {
  /**
   * Salvar uma mensagem
   */
  save(message: WhatsAppMessage): Promise<void>;

  /**
   * Buscar mensagem por ID
   */
  findById(id: string): Promise<WhatsAppMessage | null>;

  /**
   * Buscar mensagens de uma conversa
   */
  findByConversationId(conversationId: string, limit?: number): Promise<WhatsAppMessage[]>;

  /**
   * Buscar mensagens entre dois números
   */
  findBetweenNumbers(
    from: PhoneNumber,
    to: PhoneNumber,
    limit?: number,
  ): Promise<WhatsAppMessage[]>;

  /**
   * Buscar últimas mensagens de um número
   */
  findByPhoneNumber(phoneNumber: PhoneNumber, limit?: number): Promise<WhatsAppMessage[]>;

  /**
   * Contar mensagens não lidas de um número
   */
  countUnreadMessages(phoneNumber: PhoneNumber): Promise<number>;

  /**
   * Atualizar status da mensagem
   */
  updateStatus(messageId: string, status: string): Promise<void>;
}
