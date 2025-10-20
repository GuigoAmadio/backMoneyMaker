import { Injectable, Inject } from '@nestjs/common';
import { BudgetEntity } from '../../../domain/entities/budget.entity';
import { IBudgetRepository } from '../../../domain/repositories/budget.repository';
import { BudgetStatusVO } from '../../../domain/value-objects/budget-status.vo';
import { BudgetPeriod, BudgetStatus } from '@prisma/client';

export interface CreateBudgetInput {
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  clientId: string;
  userId: string;
  workspaceId?: string;
}

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    @Inject('BUDGET_REPOSITORY')
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(input: CreateBudgetInput): Promise<BudgetEntity> {
    const budget = BudgetEntity.create({
      name: input.name,
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate,
      status: BudgetStatusVO.create(BudgetStatus.ACTIVE),
      clientId: input.clientId,
      userId: input.userId,
      workspaceId: input.workspaceId,
    });

    return await this.budgetRepository.create(budget);
  }
}
