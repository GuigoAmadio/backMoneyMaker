import { BotCommand } from '../../domain/entities/bot-command.entity';

/**
 * Interface base para Command Handlers
 * Cada handler implementa a lógica de um tipo específico de comando
 */
export interface ICommandHandler {
  /**
   * Verifica se o handler pode executar o comando
   */
  canHandle(command: BotCommand): boolean;

  /**
   * Executa o comando e retorna a resposta
   */
  execute(command: BotCommand): Promise<string>;
}

/**
 * Classe base abstrata para Command Handlers
 */
export abstract class BaseCommandHandler implements ICommandHandler {
  abstract canHandle(command: BotCommand): boolean;
  abstract execute(command: BotCommand): Promise<string>;

  /**
   * Formata resposta de erro
   */
  protected formatError(message: string): string {
    return `❌ *Erro*\n\n${message}`;
  }

  /**
   * Formata resposta de sucesso
   */
  protected formatSuccess(message: string): string {
    return `✅ ${message}`;
  }

  /**
   * Formata lista de itens
   */
  protected formatList(title: string, items: string[]): string {
    return `📋 *${title}*\n\n${items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`;
  }

  /**
   * Limita número de caracteres
   */
  protected truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
