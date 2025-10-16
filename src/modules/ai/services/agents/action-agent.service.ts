import { Injectable, Logger } from '@nestjs/common';

/**
 * Action Agent Service
 *
 * Handles action execution commands (open modals, create/edit/delete entities)
 */
@Injectable()
export class ActionAgentService {
  private readonly logger = new Logger(ActionAgentService.name);

  private readonly modals = {
    // Create modals
    'create-product': { type: 'modal', action: 'create', entity: 'product' },
    'create-client': { type: 'modal', action: 'create', entity: 'client' },
    'create-appointment': { type: 'modal', action: 'create', entity: 'appointment' },
    'create-order': { type: 'modal', action: 'create', entity: 'order' },
    'create-transaction': { type: 'modal', action: 'create', entity: 'transaction' },

    // Edit modals (require ID)
    'edit-product': { type: 'modal', action: 'edit', entity: 'product' },
    'edit-client': { type: 'modal', action: 'edit', entity: 'client' },
    'edit-appointment': { type: 'modal', action: 'edit', entity: 'appointment' },
    'edit-order': { type: 'modal', action: 'edit', entity: 'order' },
  };

  /**
   * Parse action from user intent
   */
  parseAction(intent: string): {
    type: 'modal' | 'execute' | 'navigate';
    action: string;
    entity?: string;
    payload?: any;
  } | null {
    const normalizedIntent = intent.toLowerCase().trim();

    // Check for create actions
    if (normalizedIntent.includes('criar') || normalizedIntent.includes('create')) {
      if (normalizedIntent.includes('produto') || normalizedIntent.includes('product')) {
        return {
          type: 'modal',
          action: 'create',
          entity: 'product',
        };
      }
      if (normalizedIntent.includes('cliente') || normalizedIntent.includes('client')) {
        return {
          type: 'modal',
          action: 'create',
          entity: 'client',
        };
      }
      if (normalizedIntent.includes('agendamento') || normalizedIntent.includes('appointment')) {
        return {
          type: 'modal',
          action: 'create',
          entity: 'appointment',
        };
      }
      if (normalizedIntent.includes('pedido') || normalizedIntent.includes('order')) {
        return {
          type: 'modal',
          action: 'create',
          entity: 'order',
        };
      }
      if (normalizedIntent.includes('transação') || normalizedIntent.includes('transaction')) {
        return {
          type: 'modal',
          action: 'create',
          entity: 'transaction',
        };
      }
    }

    // Check for edit actions
    if (normalizedIntent.includes('editar') || normalizedIntent.includes('edit')) {
      if (normalizedIntent.includes('produto') || normalizedIntent.includes('product')) {
        return {
          type: 'modal',
          action: 'edit',
          entity: 'product',
        };
      }
      if (normalizedIntent.includes('cliente') || normalizedIntent.includes('client')) {
        return {
          type: 'modal',
          action: 'edit',
          entity: 'client',
        };
      }
    }

    // Check for delete actions
    if (normalizedIntent.includes('excluir') || normalizedIntent.includes('delete')) {
      return {
        type: 'execute',
        action: 'delete',
      };
    }

    // Check for view/show actions
    if (
      normalizedIntent.includes('mostrar') ||
      normalizedIntent.includes('show') ||
      normalizedIntent.includes('ver') ||
      normalizedIntent.includes('view')
    ) {
      return {
        type: 'execute',
        action: 'show',
      };
    }

    return null;
  }

  /**
   * Get modal configuration
   */
  getModalConfig(modalKey: string): any {
    return this.modals[modalKey];
  }

  /**
   * Get all available actions
   */
  getAvailableActions(): Record<string, any> {
    return this.modals;
  }

  /**
   * Build action payload
   */
  buildActionPayload(
    action: string,
    entity: string,
    data?: any,
  ): {
    type: 'open-modal' | 'execute-action';
    payload: any;
  } {
    if (action === 'create' || action === 'edit') {
      return {
        type: 'open-modal',
        payload: {
          modal: `${action}-${entity}`,
          mode: action,
          entity,
          data,
        },
      };
    }

    return {
      type: 'execute-action',
      payload: {
        action,
        entity,
        data,
      },
    };
  }
}
