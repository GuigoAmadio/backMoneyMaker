import { Injectable, Inject } from '@nestjs/common';
import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { IFinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';
import { GoalStatusVO } from '../../../domain/value-objects/goal-status.vo';
import { Decimal } from '@prisma/client/runtime/library';
import { GoalStatus } from '@prisma/client';

export interface CreateFinancialGoalInput {
  title: string;
  description?: string;
  targetAmount: number | Decimal;
  currentAmount?: number | Decimal;
  targetDate: Date;
  clientId: string;
  userId: string;
  workspaceId?: string;
}

@Injectable()
export class CreateFinancialGoalUseCase {
  constructor(
    @Inject('FINANCIAL_GOAL_REPOSITORY')
    private readonly financialGoalRepository: IFinancialGoalRepository,
  ) {}

  async execute(input: CreateFinancialGoalInput): Promise<FinancialGoalEntity> {
    const goal = FinancialGoalEntity.create({
      title: input.title,
      description: input.description,
      targetAmount: new Decimal(input.targetAmount),
      currentAmount: new Decimal(input.currentAmount || 0),
      targetDate: input.targetDate,
      status: GoalStatusVO.create(GoalStatus.ACTIVE),
      clientId: input.clientId,
      userId: input.userId,
      workspaceId: input.workspaceId,
    });

    return await this.financialGoalRepository.create(goal);
  }
}
