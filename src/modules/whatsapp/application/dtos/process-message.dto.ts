import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO: ProcessMessageDto
 * Dados para processar uma mensagem recebida do WhatsApp
 */
export class ProcessMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  from: string; // Número de telefone do remetente

  @IsString()
  @IsNotEmpty()
  to: string; // Número de telefone do destinatário (seu bot)

  @IsString()
  @IsNotEmpty()
  content: string; // Conteúdo da mensagem

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  replyToMessageId?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;
}
