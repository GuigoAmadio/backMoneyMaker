import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IBudgetRepository, BudgetFilters } from '../../domain/repositories/budget.repository';
import { BudgetEntity } from '../../domain/entities/budget.entity';
import { BudgetStatusVO } from '../../domain/value-objects/budget-status.vo';
import { Budget, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetRepositoryImpl implements IBudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(budget: BudgetEntity): Promise<BudgetEntity> {
    const data: Prisma.BudgetCreateInput = {
      id: budget.id,
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      totalAmount: new Decimal(0),
      spentAmount: new Decimal(0),
      status: budget.status.getValue(),
      client: { connect: { id: budget.clientId } },
      user: { connect: { id: budget.userId } },
      ...(budget.workspaceId && {
        workspace: { connect: { id: budget.workspaceId } },
      }),
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };

    const created = await this.prisma.budget.create({ data });
    return this.toDomain(created);
  }

  async update(budget: BudgetEntity): Promise<BudgetEntity> {
    const data: Prisma.BudgetUpdateInput = {
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      status: budget.status.getValue(),
      updatedAt: budget.updatedAt,
    };

    const updated = await this.prisma.budget.update({
      where: { id: budget.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<BudgetEntity | null> {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
    });

    return budget ? this.toDomain(budget) : null;
  }

  async findByClientAndUser(
    clientId: string,
    userId: string,
    filters?: BudgetFilters,
  ): Promise<BudgetEntity[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        clientId,
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.period && { period: filters.period }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((b) => this.toDomain(b));
  }

  async findByWorkspace(workspaceId: string, filters?: BudgetFilters): Promise<BudgetEntity[]> {
    const budgets = await this.prisma.budget.findMany({
      where: {
        workspaceId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.period && { period: filters.period }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((b) => this.toDomain(b));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budget.delete({ where: { id } });
  }

  async getSummary(budgetId: string): Promise<any> {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!budget) {
      return null;
    }

    const totalAllocated = budget.categories.reduce(
      (sum, cat) => sum.add(cat.amount),
      new Decimal(0),
    );
    const totalSpent = budget.categories.reduce(
      (sum, cat) => sum.add(cat.spentAmount),
      new Decimal(0),
    );
    const remaining = totalAllocated.sub(totalSpent);
    const percentageUsed = totalAllocated.gt(0)
      ? totalSpent.div(totalAllocated).mul(100).toNumber()
      : 0;

    const categoryBreakdown = budget.categories.map((cat) => ({
      category: cat.category,
      allocated: cat.amount,
      spent: cat.spentAmount,
      remaining: cat.amount.sub(cat.spentAmount),
      percentageUsed: cat.amount.gt(0) ? cat.spentAmount.div(cat.amount).mul(100).toNumber() : 0,
      isOverBudget: cat.spentAmount.gt(cat.amount),
    }));

    return {
      budget: {
        id: budget.id,
        name: budget.name,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        status: budget.status,
      },
      summary: {
        totalAllocated,
        totalSpent,
        remaining,
        percentageUsed,
      },
      categoryBreakdown,
    };
  }

  private toDomain(budget: Budget): BudgetEntity {
    return BudgetEntity.reconstitute({
      id: budget.id,
      name: budget.name,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      status: BudgetStatusVO.create(budget.status),
      clientId: budget.clientId,
      userId: budget.userId,
      workspaceId: budget.workspaceId || undefined,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    });
  }
}
