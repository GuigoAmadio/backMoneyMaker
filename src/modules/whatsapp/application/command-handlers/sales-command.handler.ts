import { Injectable } from '@nestjs/common';
import { BaseCommandHandler } from './base-command.handler';
import { BotCommand } from '../../domain/entities/bot-command.entity';
import { CommandCategory } from '../../domain/value-objects/command-type.vo';
import { PrismaService } from '../../../../database/prisma.service';

/**
 * Command Handler: Sales
 * Processa comandos relacionados a vendas
 */
@Injectable()
export class SalesCommandHandler extends BaseCommandHandler {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  canHandle(command: BotCommand): boolean {
    return command.getCommandType().getCategory() === CommandCategory.SALES;
  }

  async execute(command: BotCommand): Promise<string> {
    const commandText = command.getCommandType().getCommand();
    const clientId = command.getClientId();

    if (!clientId) {
      return this.formatError('Cliente não identificado.');
    }

    switch (commandText) {
      case '/vendas':
        return this.getSalesSummary(clientId);

      case '/vendashoje':
        return this.getTodaySales(clientId);

      default:
        return this.formatError('Comando de vendas não reconhecido.');
    }
  }

  /**
   * Resumo geral de vendas
   */
  private async getSalesSummary(clientId: string): Promise<string> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Vendas de hoje
      const todaySales = await this.prisma.order.aggregate({
        where: {
          clientId,
          createdAt: { gte: today },
          status: 'COMPLETED' as any,
        },
        _sum: { total: true },
        _count: true,
      });

      // Vendas do mês
      const monthSales = await this.prisma.order.aggregate({
        where: {
          clientId,
          createdAt: { gte: thisMonth },
          status: 'COMPLETED' as any,
        },
        _sum: { total: true },
        _count: true,
      });

      return (
        `📊 *Resumo de Vendas*\n\n` +
        `*Hoje:*\n` +
        `💰 R$ ${(Number(todaySales._sum.total) || 0).toFixed(2)}\n` +
        `📦 ${todaySales._count} pedidos\n\n` +
        `*Este Mês:*\n` +
        `💰 R$ ${(Number(monthSales._sum.total) || 0).toFixed(2)}\n` +
        `📦 ${monthSales._count} pedidos\n\n` +
        `_Atualizado em ${new Date().toLocaleString('pt-BR')}_`
      );
    } catch (error) {
      return this.formatError('Erro ao buscar dados de vendas.');
    }
  }

  /**
   * Vendas de hoje
   */
  private async getTodaySales(clientId: string): Promise<string> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sales = await this.prisma.order.findMany({
        where: {
          clientId,
          createdAt: { gte: today },
          status: 'COMPLETED' as any,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (sales.length === 0) {
        return this.formatError('Nenhuma venda realizada hoje.');
      }

      const items = sales.map(
        (s) =>
          `💰 R$ ${Number(s.total).toFixed(2)}\n` +
          `👤 Cliente\n` +
          `🕐 ${new Date(s.createdAt).toLocaleTimeString('pt-BR')}\n` +
          `_Pedido: ${s.id}_`,
      );

      const total = sales.reduce((sum, s) => sum + Number(s.total), 0);

      return (
        `📊 *Vendas de Hoje*\n\n` +
        items.join('\n\n') +
        `\n\n━━━━━━━━━━━━━━━\n` +
        `💰 *Total: R$ ${total.toFixed(2)}*\n` +
        `📦 *${sales.length} pedidos*`
      );
    } catch (error) {
      return this.formatError('Erro ao buscar vendas de hoje.');
    }
  }
}
