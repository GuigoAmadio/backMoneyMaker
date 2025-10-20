import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IBudgetCategoryRepository } from '../../domain/repositories/budget-category.repository';
import { BudgetCategoryEntity } from '../../domain/entities/budget-category.entity';
import { BudgetCategory, Prisma } from '@prisma/client';

@Injectable()
export class BudgetCategoryRepositoryImpl implements IBudgetCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(budgetCategory: BudgetCategoryEntity): Promise<BudgetCategoryEntity> {
    const data: Prisma.BudgetCategoryCreateInput = {
      id: budgetCategory.id,
      budget: { connect: { id: budgetCategory.budgetId } },
      category: { connect: { id: budgetCategory.categoryId } },
      amount: budgetCategory.amount,
      spentAmount: budgetCategory.spentAmount,
      createdAt: budgetCategory.createdAt,
      updatedAt: budgetCategory.updatedAt,
    };

    const created = await this.prisma.budgetCategory.create({ data });
    return this.toDomain(created);
  }

  async update(budgetCategory: BudgetCategoryEntity): Promise<BudgetCategoryEntity> {
    const data: Prisma.BudgetCategoryUpdateInput = {
      amount: budgetCategory.amount,
      spentAmount: budgetCategory.spentAmount,
      updatedAt: budgetCategory.updatedAt,
    };

    const updated = await this.prisma.budgetCategory.update({
      where: { id: budgetCategory.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<BudgetCategoryEntity | null> {
    const budgetCategory = await this.prisma.budgetCategory.findUnique({
      where: { id },
    });

    return budgetCategory ? this.toDomain(budgetCategory) : null;
  }

  async findByBudget(budgetId: string): Promise<BudgetCategoryEntity[]> {
    const budgetCategories = await this.prisma.budgetCategory.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'asc' },
    });

    return budgetCategories.map((bc) => this.toDomain(bc));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budgetCategory.delete({ where: { id } });
  }

  async exists(budgetId: string, categoryId: string): Promise<boolean> {
    const count = await this.prisma.budgetCategory.count({
      where: {
        budgetId,
        categoryId,
      },
    });

    return count > 0;
  }

  private toDomain(budgetCategory: BudgetCategory): BudgetCategoryEntity {
    return BudgetCategoryEntity.reconstitute({
      id: budgetCategory.id,
      budgetId: budgetCategory.budgetId,
      categoryId: budgetCategory.categoryId,
      amount: budgetCategory.amount,
      spentAmount: budgetCategory.spentAmount,
      createdAt: budgetCategory.createdAt,
      updatedAt: budgetCategory.updatedAt,
    });
  }
}
