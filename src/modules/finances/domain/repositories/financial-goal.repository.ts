import { FinancialGoalEntity } from '../entities/financial-goal.entity';
import { GoalStatus } from '@prisma/client';

export interface IFinancialGoalRepository {
  create(goal: FinancialGoalEntity): Promise<FinancialGoalEntity>;
  update(goal: FinancialGoalEntity): Promise<FinancialGoalEntity>;
  findById(id: string): Promise<FinancialGoalEntity | null>;
  findByClientAndUser(
    clientId: string,
    userId: string,
    status?: GoalStatus,
  ): Promise<FinancialGoalEntity[]>;
  findByWorkspace(workspaceId: string, status?: GoalStatus): Promise<FinancialGoalEntity[]>;
  delete(id: string): Promise<void>;
}
