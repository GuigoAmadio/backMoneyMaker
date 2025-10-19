import { Injectable } from '@nestjs/common';
import { BaseCommandHandler } from './base-command.handler';
import { BotCommand } from '../../domain/entities/bot-command.entity';
import { CommandCategory } from '../../domain/value-objects/command-type.vo';
import { PrismaService } from '../../../../database/prisma.service';

/**
 * Command Handler: Products
 * Processa comandos relacionados a produtos
 */
@Injectable()
export class ProductsCommandHandler extends BaseCommandHandler {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  canHandle(command: BotCommand): boolean {
    return command.getCommandType().getCategory() === CommandCategory.PRODUCTS;
  }

  async execute(command: BotCommand): Promise<string> {
    const commandText = command.getCommandType().getCommand();
    const args = command.getArgs();
    const clientId = command.getClientId();

    if (!clientId) {
      return this.formatError('Cliente não identificado. Por favor, registre-se primeiro.');
    }

    switch (commandText) {
      case '/produtos':
        return this.listProducts(clientId);

      case '/produto':
        if (args.length === 0) {
          return this.formatError('Por favor, informe o ID do produto.\nExemplo: /produto 123');
        }
        return this.getProductDetails(clientId, args[0]);

      case '/estoque':
        if (args.length === 0) {
          return this.checkLowStock(clientId);
        }
        return this.getProductStock(clientId, args[0]);

      default:
        return this.formatError('Comando de produto não reconhecido.');
    }
  }

  /**
   * Lista produtos disponíveis
   */
  private async listProducts(clientId: string): Promise<string> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          clientId,
          isActive: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      if (products.length === 0) {
        return this.formatError('Nenhum produto cadastrado.');
      }

      const items = products.map((p) => {
        const stockIcon = p.stock > 10 ? '✅' : p.stock > 0 ? '⚠️' : '❌';
        return `${stockIcon} *${this.truncate(p.name, 40)}*\nR$ ${p.price.toFixed(2)} | Estoque: ${p.stock}\nID: ${p.id}`;
      });

      return this.formatList('Produtos Disponíveis', items);
    } catch (error) {
      return this.formatError('Erro ao buscar produtos.');
    }
  }

  /**
   * Detalhes de um produto específico
   */
  private async getProductDetails(clientId: string, productId: string): Promise<string> {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          clientId,
        },
        include: {
          category: true,
        },
      });

      if (!product) {
        return this.formatError('Produto não encontrado.');
      }

      const stockStatus =
        product.stock > 10
          ? '✅ Disponível'
          : product.stock > 0
            ? '⚠️ Estoque Baixo'
            : '❌ Esgotado';

      return (
        `📦 *${product.name}*\n\n` +
        `💰 *Preço:* R$ ${product.price.toFixed(2)}\n` +
        `📊 *Estoque:* ${product.stock} unidades\n` +
        `📌 *Status:* ${stockStatus}\n` +
        `🏷️ *Categoria:* ${product.category?.name || 'Sem categoria'}\n` +
        `${product.description ? `\n📝 *Descrição:*\n${product.description}` : ''}\n\n` +
        `_ID: ${product.id}_`
      );
    } catch (error) {
      return this.formatError('Erro ao buscar detalhes do produto.');
    }
  }

  /**
   * Verifica produtos com estoque baixo
   */
  private async checkLowStock(clientId: string): Promise<string> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          clientId,
          isActive: true,
          stock: {
            lte: 10,
            gt: 0,
          },
        },
        take: 20,
        orderBy: { stock: 'asc' },
      });

      if (products.length === 0) {
        return this.formatSuccess('Todos os produtos estão com estoque adequado! 🎉');
      }

      const items = products.map(
        (p) => `⚠️ *${this.truncate(p.name, 40)}*\nEstoque: ${p.stock} | ID: ${p.id}`,
      );

      return (
        `🚨 *Produtos com Estoque Baixo*\n\n` +
        items.join('\n\n') +
        `\n\n_Total: ${products.length} produtos_`
      );
    } catch (error) {
      return this.formatError('Erro ao verificar estoque.');
    }
  }

  /**
   * Consulta estoque de um produto específico
   */
  private async getProductStock(clientId: string, productId: string): Promise<string> {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          clientId,
        },
      });

      if (!product) {
        return this.formatError('Produto não encontrado.');
      }

      const stockIcon = product.stock > 10 ? '✅' : product.stock > 0 ? '⚠️' : '❌';

      return (
        `📊 *Estoque - ${product.name}*\n\n` +
        `${stockIcon} *${product.stock} unidades*\n` +
        `💰 Valor total: R$ ${(Number(product.price) * product.stock).toFixed(2)}\n\n` +
        `_ID: ${product.id}_`
      );
    } catch (error) {
      return this.formatError('Erro ao consultar estoque.');
    }
  }
}
