import { Injectable } from '@nestjs/common';
import { BaseCommandHandler } from './base-command.handler';
import { BotCommand } from '../../domain/entities/bot-command.entity';
import { CommandCategory } from '../../domain/value-objects/command-type.vo';

/**
 * Command Handler: Help
 * Processa comandos de ajuda
 */
@Injectable()
export class HelpCommandHandler extends BaseCommandHandler {
  canHandle(command: BotCommand): boolean {
    return command.getCommandType().getCategory() === CommandCategory.HELP;
  }

  async execute(command: BotCommand): Promise<string> {
    const userId = command.getUserId();
    const isAuthenticated = !!userId;

    return this.getHelpMessage(isAuthenticated);
  }

  private getHelpMessage(isAuthenticated: boolean): string {
    const publicCommands = `
🤖 *Comandos Disponíveis*

*📦 Produtos:*
/produtos - Listar produtos
/produto [id] - Detalhes de um produto

*📝 Pedidos:*
/pedido [id] - Status do pedido
/meuspedidos - Meus pedidos

*❓ Ajuda:*
/ajuda - Ver comandos
/help - Ver comandos
`;

    const authenticatedCommands = `
*📊 Vendas:* (Requer autenticação)
/vendas - Resumo de vendas
/vendashoje - Vendas de hoje

*📦 Estoque:* (Admin/Manager)
/estoque - Produtos com estoque baixo
/estoque [id] - Estoque de um produto

*📈 Relatórios:* (Admin/Manager)
/relatorio - Relatório geral
/dashboard - Dashboard resumido

*👥 Clientes:* (Admin)
/clientes - Listar clientes
/cliente [id] - Detalhes do cliente
`;

    if (isAuthenticated) {
      return publicCommands + authenticatedCommands + '\n\n✅ _Você está autenticado_';
    }

    return (
      publicCommands +
      '\n\n' +
      '🔒 _Para acessar mais comandos, faça login enviando:_\n' +
      '`/login seu@email.com sua-senha`'
    );
  }
}
