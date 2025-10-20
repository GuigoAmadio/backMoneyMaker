import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IFinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';
import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { Decimal } from '@prisma/client/runtime/library';

export interface UpdateGoalProgressInput {
  goalId: string;
  amount: number | Decimal;
}

@Injectable()
export class UpdateGoalProgressUseCase {
  constructor(
    @Inject('FINANCIAL_GOAL_REPOSITORY')
    private readonly financialGoalRepository: IFinancialGoalRepository,
  ) {}

  async execute(input: UpdateGoalProgressInput): Promise<FinancialGoalEntity> {
    const goal = await this.financialGoalRepository.findById(input.goalId);

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    goal.addProgress(new Decimal(input.amount));

    return await this.financialGoalRepository.update(goal);
  }
}
