import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO: SendMessageDto
 * Dados para enviar uma mensagem via WhatsApp
 */
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string; // Número de telefone do destinatário

  @IsString()
  @IsNotEmpty()
  content: string; // Conteúdo da mensagem

  @IsString()
  @IsOptional()
  replyToMessageId?: string; // ID da mensagem que está respondendo

  @IsString()
  @IsOptional()
  conversationId?: string; // ID da conversa (para threading)
}
