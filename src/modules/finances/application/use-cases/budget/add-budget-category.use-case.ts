import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { BudgetCategoryEntity } from '../../../domain/entities/budget-category.entity';
import { IBudgetCategoryRepository } from '../../../domain/repositories/budget-category.repository';
import { IBudgetRepository } from '../../../domain/repositories/budget.repository';
import { Decimal } from '@prisma/client/runtime/library';

export interface AddBudgetCategoryInput {
  budgetId: string;
  categoryId: string;
  amount: number | Decimal;
}

@Injectable()
export class AddBudgetCategoryUseCase {
  constructor(
    @Inject('BUDGET_REPOSITORY')
    private readonly budgetRepository: IBudgetRepository,
    @Inject('BUDGET_CATEGORY_REPOSITORY')
    private readonly budgetCategoryRepository: IBudgetCategoryRepository,
  ) {}

  async execute(input: AddBudgetCategoryInput): Promise<BudgetCategoryEntity> {
    // Verificar se o budget existe
    const budget = await this.budgetRepository.findById(input.budgetId);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Verificar se a categoria já existe no budget
    const exists = await this.budgetCategoryRepository.exists(input.budgetId, input.categoryId);
    if (exists) {
      throw new BadRequestException('Category already exists in this budget');
    }

    const budgetCategory = BudgetCategoryEntity.create({
      budgetId: input.budgetId,
      categoryId: input.categoryId,
      amount: new Decimal(input.amount),
      spentAmount: new Decimal(0),
    });

    return await this.budgetCategoryRepository.create(budgetCategory);
  }
}
