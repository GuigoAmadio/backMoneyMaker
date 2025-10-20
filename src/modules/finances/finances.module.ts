import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Injection tokens
export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
export const WORKSPACE_REPOSITORY = 'WORKSPACE_REPOSITORY';
export const FINANCIAL_GOAL_REPOSITORY = 'FINANCIAL_GOAL_REPOSITORY';
export const BUDGET_REPOSITORY = 'BUDGET_REPOSITORY';
export const BUDGET_CATEGORY_REPOSITORY = 'BUDGET_CATEGORY_REPOSITORY';

// Infrastructure - Repository Implementations
import { TransactionRepositoryImpl } from './infrastructure/persistence/transaction.repository.impl';
import { WorkspaceRepositoryImpl } from './infrastructure/persistence/workspace.repository.impl';
import { FinancialGoalRepositoryImpl } from './infrastructure/persistence/financial-goal.repository.impl';
import { BudgetRepositoryImpl } from './infrastructure/persistence/budget.repository.impl';
import { BudgetCategoryRepositoryImpl } from './infrastructure/persistence/budget-category.repository.impl';

// Application - Use Cases
import { CreateTransactionUseCase } from './application/use-cases/transaction/create-transaction.use-case';
import { UpdateTransactionUseCase } from './application/use-cases/transaction/update-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/transaction/get-transactions.use-case';
import { CreateWorkspaceUseCase } from './application/use-cases/workspace/create-workspace.use-case';
import { CreateFinancialGoalUseCase } from './application/use-cases/financial-goal/create-financial-goal.use-case';
import { UpdateGoalProgressUseCase } from './application/use-cases/financial-goal/update-goal-progress.use-case';
import { CreateBudgetUseCase } from './application/use-cases/budget/create-budget.use-case';
import { AddBudgetCategoryUseCase } from './application/use-cases/budget/add-budget-category.use-case';

// Presentation - Controllers
import { TransactionsController } from './presentation/transactions.controller';
import { WorkspacesController } from './presentation/workspaces.controller';
import { FinancialGoalsController } from './presentation/financial-goals.controller';
import { BudgetsController } from './presentation/budgets.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    TransactionsController,
    WorkspacesController,
    FinancialGoalsController,
    BudgetsController,
  ],
  providers: [
    // Repository implementations with string tokens
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepositoryImpl,
    },
    {
      provide: WORKSPACE_REPOSITORY,
      useClass: WorkspaceRepositoryImpl,
    },
    {
      provide: FINANCIAL_GOAL_REPOSITORY,
      useClass: FinancialGoalRepositoryImpl,
    },
    {
      provide: BUDGET_REPOSITORY,
      useClass: BudgetRepositoryImpl,
    },
    {
      provide: BUDGET_CATEGORY_REPOSITORY,
      useClass: BudgetCategoryRepositoryImpl,
    },

    // Use Cases
    CreateTransactionUseCase,
    UpdateTransactionUseCase,
    GetTransactionsUseCase,
    CreateWorkspaceUseCase,
    CreateFinancialGoalUseCase,
    UpdateGoalProgressUseCase,
    CreateBudgetUseCase,
    AddBudgetCategoryUseCase,
  ],
  exports: [
    TRANSACTION_REPOSITORY,
    WORKSPACE_REPOSITORY,
    FINANCIAL_GOAL_REPOSITORY,
    BUDGET_REPOSITORY,
    BUDGET_CATEGORY_REPOSITORY,
    CreateTransactionUseCase,
    UpdateTransactionUseCase,
    GetTransactionsUseCase,
    CreateWorkspaceUseCase,
    CreateFinancialGoalUseCase,
    UpdateGoalProgressUseCase,
    CreateBudgetUseCase,
    AddBudgetCategoryUseCase,
  ],
})
export class FinancesModule {}
