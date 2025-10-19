/**
 * Interface: IWhatsAppApiClient
 * Define o contrato para comunicação com a API do WhatsApp Business
 */
export interface IWhatsAppApiClient {
  /**
   * Enviar uma mensagem de texto
   */
  sendMessage(data: {
    to: string;
    message: string;
    replyToMessageId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Enviar uma mensagem com template
   */
  sendTemplate(data: {
    to: string;
    templateName: string;
    templateParams?: Record<string, string>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;

  /**
   * Marcar mensagem como lida
   */
  markAsRead(messageId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Verificar status de uma mensagem
   */
  getMessageStatus(messageId: string): Promise<{ status: string; error?: string }>;
}
