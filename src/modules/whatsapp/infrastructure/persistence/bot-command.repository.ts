import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IBotCommandRepository } from '../../domain/repositories/bot-command.repository.interface';
import { BotCommand, CommandStatus } from '../../domain/entities/bot-command.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { CommandType } from '../../domain/value-objects/command-type.vo';

/**
 * Implementação: BotCommandRepository
 * Persistência de comandos usando Prisma
 */
@Injectable()
export class BotCommandRepository implements IBotCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(command: BotCommand): Promise<void> {
    await this.prisma.botCommand.upsert({
      where: { id: command.getId() },
      create: {
        id: command.getId(),
        phoneNumber: command.getPhoneNumber().toWhatsAppFormat(),
        command: command.getCommandType().getCommand(),
        category: command.getCommandType().getCategory(),
        args: JSON.stringify(command.getArgs()),
        status: command.getStatus(),
        result: command.getResult(),
        error: command.getError(),
        executedAt: command.getExecutedAt(),
        userId: command.getUserId(),
        clientId: command.getClientId(),
      },
      update: {
        status: command.getStatus(),
        result: command.getResult(),
        error: command.getError(),
      },
    });
  }

  async findById(id: string): Promise<BotCommand | null> {
    const data = await this.prisma.botCommand.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber, limit: number = 50): Promise<BotCommand[]> {
    const phone = phoneNumber.toWhatsAppFormat();

    const commands = await this.prisma.botCommand.findMany({
      where: { phoneNumber: phone },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });

    return commands.map((c) => this.toDomain(c));
  }

  async findByStatus(status: string, limit: number = 50): Promise<BotCommand[]> {
    const commands = await this.prisma.botCommand.findMany({
      where: { status },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });

    return commands.map((c) => this.toDomain(c));
  }

  async countByCategory(category: string, startDate?: Date, endDate?: Date): Promise<number> {
    return this.prisma.botCommand.count({
      where: {
        category,
        executedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async findByClientId(clientId: string, limit: number = 50): Promise<BotCommand[]> {
    const commands = await this.prisma.botCommand.findMany({
      where: { clientId },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });

    return commands.map((c) => this.toDomain(c));
  }

  /**
   * Converte modelo Prisma para Entity de domínio
   */
  private toDomain(data: any): BotCommand {
    const args = data.args ? JSON.parse(data.args) : [];

    return BotCommand.create({
      id: data.id,
      phoneNumber: PhoneNumber.create(data.phoneNumber),
      commandType: CommandType.create(data.command),
      args,
      userId: data.userId,
      clientId: data.clientId,
    });
  }
}
