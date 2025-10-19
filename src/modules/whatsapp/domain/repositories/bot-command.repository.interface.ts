import { BotCommand } from '../entities/bot-command.entity';
import { PhoneNumber } from '../value-objects/phone-number.vo';

/**
 * Repository Interface: IBotCommandRepository
 * Define o contrato para persistência de comandos
 */
export interface IBotCommandRepository {
  /**
   * Salvar um comando
   */
  save(command: BotCommand): Promise<void>;

  /**
   * Buscar comando por ID
   */
  findById(id: string): Promise<BotCommand | null>;

  /**
   * Buscar comandos executados por um número
   */
  findByPhoneNumber(phoneNumber: PhoneNumber, limit?: number): Promise<BotCommand[]>;

  /**
   * Buscar comandos por status
   */
  findByStatus(status: string, limit?: number): Promise<BotCommand[]>;

  /**
   * Contar comandos executados por categoria
   */
  countByCategory(category: string, startDate?: Date, endDate?: Date): Promise<number>;

  /**
   * Buscar comandos por cliente (tenant)
   */
  findByClientId(clientId: string, limit?: number): Promise<BotCommand[]>;
}
