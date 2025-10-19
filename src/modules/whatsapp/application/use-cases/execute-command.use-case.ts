import { Injectable, Logger } from '@nestjs/common';
import { BotCommand } from '../../domain/entities/bot-command.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { MessageContent } from '../../domain/value-objects/message-content.vo';
import { CommandType } from '../../domain/value-objects/command-type.vo';
import { IBotCommandRepository } from '../../domain/repositories/bot-command.repository.interface';
import { ICommandHandler } from '../command-handlers/base-command.handler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use Case: Execute Command
 * Executa um comando do bot
 */
@Injectable()
export class ExecuteCommandUseCase {
  private readonly logger = new Logger(ExecuteCommandUseCase.name);

  constructor(
    private readonly commandRepository: IBotCommandRepository,
    private readonly commandHandlers: ICommandHandler[],
  ) {}

  async execute(data: {
    phoneNumber: string;
    messageContent: string;
    userId?: string;
    clientId?: string;
    conversationId?: string;
  }): Promise<{ success: boolean; response: string }> {
    try {
      // 1. Criar Value Objects
      const phoneNumber = PhoneNumber.create(data.phoneNumber);
      const content = MessageContent.create(data.messageContent);

      const commandString = content.extractCommand();
      if (!commandString) {
        return {
          success: false,
          response: '❌ Formato de comando inválido.',
        };
      }

      const commandType = CommandType.create(commandString);
      const args = content.extractCommandArgs();

      this.logger.log(`🎯 Executando comando: ${commandString} com ${args.length} argumentos`);

      // 2. Criar Entity BotCommand
      const command = BotCommand.create({
        id: uuidv4(),
        phoneNumber,
        commandType,
        args,
        userId: data.userId,
        clientId: data.clientId,
      });

      // 3. Validar comando
      try {
        command.validateForExecution();
      } catch (error) {
        this.logger.warn(`⚠️  Validação falhou: ${error.message}`);
        return {
          success: false,
          response: `❌ ${error.message}\n\nEnvie /ajuda para ver comandos disponíveis.`,
        };
      }

      // 4. Verificar se comando é desconhecido
      if (commandType.isUnknown()) {
        return {
          success: false,
          response: `❌ Comando "${commandString}" não reconhecido.\n\nEnvie /ajuda para ver comandos disponíveis.`,
        };
      }

      // 5. Marcar como executando
      command.markAsExecuting();

      // 6. Encontrar handler apropriado
      const handler = this.commandHandlers.find((h) => h.canHandle(command));

      if (!handler) {
        this.logger.error(`❌ Nenhum handler encontrado para: ${commandString}`);
        command.fail('Handler não encontrado');
        await this.commandRepository.save(command);

        return {
          success: false,
          response: '❌ Comando não implementado ainda.',
        };
      }

      // 7. Executar comando
      this.logger.log(`⚡ Handler encontrado, executando...`);
      const result = await handler.execute(command);

      // 8. Marcar como completo
      command.complete(result);
      await this.commandRepository.save(command);

      this.logger.log(`✅ Comando executado com sucesso: ${command.getId()}`);

      return {
        success: true,
        response: result,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao executar comando: ${error.message}`, error.stack);

      return {
        success: false,
        response: '❌ Erro ao processar comando. Por favor, tente novamente.',
      };
    }
  }
}
