import { Injectable, Logger } from '@nestjs/common';

/**
 * Navigation Agent Service
 *
 * Handles navigation commands to move users through the dashboard
 */
@Injectable()
export class NavigationAgentService {
  private readonly logger = new Logger(NavigationAgentService.name);

  private readonly routes = {
    // Main routes
    dashboard: '/',
    products: '/creator/products',
    clients: '/creator/clients',
    appointments: '/creator/schedule',
    orders: '/creator/orders',
    finances: '/creator/finances',
    analytics: '/creator/analytics',
    settings: '/creator/settings',

    // Workspace routes
    workspace: '/creator/workspace',
    'workspace-members': '/creator/workspace/members',
    'workspace-settings': '/creator/workspace/settings',

    // Finance sub-routes
    'finances-transactions': '/creator/finances/transactions',
    'finances-budgets': '/creator/finances/budgets',
    'finances-goals': '/creator/finances/goals',

    // Profile
    profile: '/creator/profile',
  };

  /**
   * Get navigation command from user intent
   */
  getNavigationCommand(intent: string): { route: string; action?: string } | null {
    const normalizedIntent = intent.toLowerCase().trim();

    // Direct route matches
    for (const [key, route] of Object.entries(this.routes)) {
      if (normalizedIntent.includes(key) || normalizedIntent.includes(key.replace('-', ' '))) {
        return { route };
      }
    }

    // Common phrases
    if (
      normalizedIntent.includes('home') ||
      normalizedIntent.includes('início') ||
      normalizedIntent.includes('dashboard')
    ) {
      return { route: this.routes.dashboard };
    }

    if (
      normalizedIntent.includes('produto') ||
      normalizedIntent.includes('product') ||
      normalizedIntent.includes('estoque') ||
      normalizedIntent.includes('inventory')
    ) {
      return { route: this.routes.products };
    }

    if (
      normalizedIntent.includes('cliente') ||
      normalizedIntent.includes('client') ||
      normalizedIntent.includes('customer')
    ) {
      return { route: this.routes.clients };
    }

    if (
      normalizedIntent.includes('agendamento') ||
      normalizedIntent.includes('appointment') ||
      normalizedIntent.includes('agenda') ||
      normalizedIntent.includes('schedule')
    ) {
      return { route: this.routes.appointments };
    }

    if (
      normalizedIntent.includes('pedido') ||
      normalizedIntent.includes('order') ||
      normalizedIntent.includes('venda') ||
      normalizedIntent.includes('sale')
    ) {
      return { route: this.routes.orders };
    }

    if (
      normalizedIntent.includes('finanças') ||
      normalizedIntent.includes('finance') ||
      normalizedIntent.includes('money') ||
      normalizedIntent.includes('dinheiro')
    ) {
      return { route: this.routes.finances };
    }

    if (
      normalizedIntent.includes('analítica') ||
      normalizedIntent.includes('analytics') ||
      normalizedIntent.includes('relatório') ||
      normalizedIntent.includes('report')
    ) {
      return { route: this.routes.analytics };
    }

    if (
      normalizedIntent.includes('configuração') ||
      normalizedIntent.includes('settings') ||
      normalizedIntent.includes('config')
    ) {
      return { route: this.routes.settings };
    }

    if (
      normalizedIntent.includes('workspace') ||
      normalizedIntent.includes('equipe') ||
      normalizedIntent.includes('team')
    ) {
      return { route: this.routes.workspace };
    }

    return null;
  }

  /**
   * Get all available routes
   */
  getAvailableRoutes(): Record<string, string> {
    return this.routes;
  }

  /**
   * Validate if route exists
   */
  isValidRoute(route: string): boolean {
    return Object.values(this.routes).includes(route);
  }
}
