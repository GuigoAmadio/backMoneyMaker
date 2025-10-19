import { Injectable, Logger } from '@nestjs/common';
import { ProcessMessageDto } from '../dtos/process-message.dto';
import { WhatsAppMessage, MessageDirection } from '../../domain/entities/whatsapp-message.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';
import { IWhatsAppMessageRepository } from '../../domain/repositories/whatsapp-message.repository.interface';
import { ExecuteCommandUseCase } from './execute-command.use-case';

/**
 * Use Case: Process Incoming Message
 * Processa mensagem recebida do WhatsApp e executa comando se necessário
 */
@Injectable()
export class ProcessIncomingMessageUseCase {
  private readonly logger = new Logger(ProcessIncomingMessageUseCase.name);

  constructor(
    private readonly messageRepository: IWhatsAppMessageRepository,
    private readonly executeCommandUseCase: ExecuteCommandUseCase,
  ) {}

  async execute(
    dto: ProcessMessageDto,
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      this.logger.log(`📥 Processando mensagem de ${dto.from}`);

      // 1. Criar Value Objects
      const from = PhoneNumber.create(dto.from);
      const to = PhoneNumber.create(dto.to);
      const content = MessageContent.create(dto.content);

      // 2. Criar Entity
      const message = WhatsAppMessage.create({
        id: dto.messageId,
        from,
        to,
        content,
        direction: MessageDirection.INCOMING,
        conversationId: dto.conversationId,
        replyToMessageId: dto.replyToMessageId,
      });

      // 3. Persistir mensagem
      await this.messageRepository.save(message);
      this.logger.log(`💾 Mensagem salva: ${message.getId()}`);

      // 4. Verificar se é comando
      if (message.isCommand()) {
        this.logger.log(`⚡ Detectado comando: ${content.extractCommand()}`);

        const commandResult = await this.executeCommandUseCase.execute({
          phoneNumber: dto.from,
          messageContent: dto.content,
          conversationId: dto.conversationId,
        });

        return {
          success: true,
          response: commandResult.response,
        };
      }

      // 5. Resposta padrão para mensagens que não são comandos
      return {
        success: true,
        response: this.getDefaultResponse(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getDefaultResponse(): string {
    return (
      '👋 Olá! Sou o bot do MoneyMaker.\n\n' +
      'Para ver os comandos disponíveis, envie:\n' +
      '`/ajuda` ou `/help`\n\n' +
      'Exemplos:\n' +
      '• `/produtos` - Ver produtos\n' +
      '• `/vendas` - Ver vendas\n' +
      '• `/pedido 123` - Ver pedido'
    );
  }
}
