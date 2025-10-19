/**
 * Value Object: CommandType
 * Define os tipos de comandos permitidos no bot
 */
export enum CommandCategory {
  PRODUCTS = 'PRODUCTS',
  SALES = 'SALES',
  ORDERS = 'ORDERS',
  CUSTOMERS = 'CUSTOMERS',
  REPORTS = 'REPORTS',
  HELP = 'HELP',
  UNKNOWN = 'UNKNOWN',
}

export class CommandType {
  private constructor(
    private readonly command: string,
    private readonly category: CommandCategory,
    private readonly requiresAuth: boolean,
    private readonly allowedRoles: string[],
  ) {}

  static create(command: string): CommandType {
    const normalized = command.toLowerCase().trim();

    // Mapear comandos para categorias
    const commandMap: Record<
      string,
      { category: CommandCategory; requiresAuth: boolean; roles: string[] }
    > = {
      // Produtos
      '/produtos': { category: CommandCategory.PRODUCTS, requiresAuth: false, roles: [] },
      '/produto': { category: CommandCategory.PRODUCTS, requiresAuth: false, roles: [] },
      '/estoque': {
        category: CommandCategory.PRODUCTS,
        requiresAuth: true,
        roles: ['admin', 'manager'],
      },

      // Vendas
      '/vendas': {
        category: CommandCategory.SALES,
        requiresAuth: true,
        roles: ['admin', 'manager', 'seller'],
      },
      '/vendashoje': {
        category: CommandCategory.SALES,
        requiresAuth: true,
        roles: ['admin', 'manager'],
      },

      // Pedidos
      '/pedido': { category: CommandCategory.ORDERS, requiresAuth: false, roles: [] },
      '/meuspedidos': { category: CommandCategory.ORDERS, requiresAuth: false, roles: [] },
      '/statuspedido': { category: CommandCategory.ORDERS, requiresAuth: false, roles: [] },

      // Clientes (apenas admin)
      '/clientes': { category: CommandCategory.CUSTOMERS, requiresAuth: true, roles: ['admin'] },
      '/cliente': {
        category: CommandCategory.CUSTOMERS,
        requiresAuth: true,
        roles: ['admin', 'manager'],
      },

      // Relatórios (apenas admin/manager)
      '/relatorio': {
        category: CommandCategory.REPORTS,
        requiresAuth: true,
        roles: ['admin', 'manager'],
      },
      '/dashboard': {
        category: CommandCategory.REPORTS,
        requiresAuth: true,
        roles: ['admin', 'manager'],
      },

      // Ajuda
      '/ajuda': { category: CommandCategory.HELP, requiresAuth: false, roles: [] },
      '/help': { category: CommandCategory.HELP, requiresAuth: false, roles: [] },
      '/comandos': { category: CommandCategory.HELP, requiresAuth: false, roles: [] },
    };

    const config = commandMap[normalized];

    if (!config) {
      return new CommandType(normalized, CommandCategory.UNKNOWN, false, []);
    }

    return new CommandType(normalized, config.category, config.requiresAuth, config.roles);
  }

  getCommand(): string {
    return this.command;
  }

  getCategory(): CommandCategory {
    return this.category;
  }

  requiresAuthentication(): boolean {
    return this.requiresAuth;
  }

  getAllowedRoles(): string[] {
    return this.allowedRoles;
  }

  isUnknown(): boolean {
    return this.category === CommandCategory.UNKNOWN;
  }

  canBeExecutedBy(userRole?: string): boolean {
    if (!this.requiresAuth) {
      return true;
    }

    if (!userRole) {
      return false;
    }

    return this.allowedRoles.length === 0 || this.allowedRoles.includes(userRole);
  }
}
