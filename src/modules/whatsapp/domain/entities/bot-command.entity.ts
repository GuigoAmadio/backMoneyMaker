import { PhoneNumber } from '../value-objects/phone-number.vo';
import { CommandType } from '../value-objects/command-type.vo';

/**
 * Entity: BotCommand
 * Representa um comando executado pelo bot com contexto e resultado
 */
export enum CommandStatus {
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class BotCommand {
  private domainEvents: string[] = [];

  private constructor(
    private readonly id: string,
    private readonly phoneNumber: PhoneNumber,
    private readonly commandType: CommandType,
    private readonly args: string[],
    private status: CommandStatus,
    private result?: string,
    private error?: string,
    private readonly executedAt: Date = new Date(),
    private readonly userId?: string,
    private readonly clientId?: string,
  ) {}

  static create(data: {
    id: string;
    phoneNumber: PhoneNumber;
    commandType: CommandType;
    args: string[];
    userId?: string;
    clientId?: string;
  }): BotCommand {
    const command = new BotCommand(
      data.id,
      data.phoneNumber,
      data.commandType,
      data.args,
      CommandStatus.PENDING,
      undefined,
      undefined,
      new Date(),
      data.userId,
      data.clientId,
    );

    command.addDomainEvent('CommandCreatedEvent');
    return command;
  }

  // ==================== Getters ====================

  getId(): string {
    return this.id;
  }

  getPhoneNumber(): PhoneNumber {
    return this.phoneNumber;
  }

  getCommandType(): CommandType {
    return this.commandType;
  }

  getArgs(): string[] {
    return this.args;
  }

  getStatus(): CommandStatus {
    return this.status;
  }

  getResult(): string | undefined {
    return this.result;
  }

  getError(): string | undefined {
    return this.error;
  }

  getExecutedAt(): Date {
    return this.executedAt;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getClientId(): string | undefined {
    return this.clientId;
  }

  getDomainEvents(): string[] {
    return this.domainEvents;
  }

  // ==================== Business Logic ====================

  /**
   * Verifica se o comando pode ser executado pelo usuário
   */
  canBeExecuted(userRole?: string): boolean {
    return this.commandType.canBeExecutedBy(userRole);
  }

  /**
   * Valida se o comando está no estado correto para execução
   */
  validateForExecution(): void {
    if (this.status !== CommandStatus.PENDING) {
      throw new Error('Comando já foi executado ou está em execução');
    }

    if (this.commandType.isUnknown()) {
      throw new Error('Comando desconhecido');
    }

    if (this.commandType.requiresAuthentication() && !this.userId) {
      throw new Error('Comando requer autenticação');
    }
  }

  /**
   * Marca comando como em execução
   */
  markAsExecuting(): void {
    if (this.status !== CommandStatus.PENDING) {
      throw new Error('Comando não está pendente');
    }

    this.status = CommandStatus.EXECUTING;
    this.addDomainEvent('CommandExecutingEvent');
  }

  /**
   * Completa comando com sucesso
   */
  complete(result: string): void {
    if (this.status !== CommandStatus.EXECUTING) {
      throw new Error('Comando não está em execução');
    }

    this.status = CommandStatus.COMPLETED;
    this.result = result;
    this.addDomainEvent('CommandCompletedEvent');
  }

  /**
   * Marca comando como falhado
   */
  fail(error: string): void {
    this.status = CommandStatus.FAILED;
    this.error = error;
    this.addDomainEvent('CommandFailedEvent');
  }

  private addDomainEvent(event: string): void {
    this.domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
