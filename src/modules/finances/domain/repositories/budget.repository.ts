import { BudgetEntity } from '../entities/budget.entity';
import { BudgetStatus, BudgetPeriod } from '@prisma/client';

export interface BudgetFilters {
  status?: BudgetStatus;
  period?: BudgetPeriod;
}

export interface IBudgetRepository {
  create(budget: BudgetEntity): Promise<BudgetEntity>;
  update(budget: BudgetEntity): Promise<BudgetEntity>;
  findById(id: string): Promise<BudgetEntity | null>;
  findByClientAndUser(
    clientId: string,
    userId: string,
    filters?: BudgetFilters,
  ): Promise<BudgetEntity[]>;
  findByWorkspace(workspaceId: string, filters?: BudgetFilters): Promise<BudgetEntity[]>;
  delete(id: string): Promise<void>;
  getSummary(budgetId: string): Promise<any>;
}
