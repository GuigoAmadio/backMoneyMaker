import { BudgetCategoryEntity } from '../entities/budget-category.entity';

export interface IBudgetCategoryRepository {
  create(budgetCategory: BudgetCategoryEntity): Promise<BudgetCategoryEntity>;
  update(budgetCategory: BudgetCategoryEntity): Promise<BudgetCategoryEntity>;
  findById(id: string): Promise<BudgetCategoryEntity | null>;
  findByBudget(budgetId: string): Promise<BudgetCategoryEntity[]>;
  delete(id: string): Promise<void>;
  exists(budgetId: string, categoryId: string): Promise<boolean>;
}
