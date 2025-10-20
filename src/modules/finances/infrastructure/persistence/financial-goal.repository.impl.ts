import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IFinancialGoalRepository } from '../../domain/repositories/financial-goal.repository';
import { FinancialGoalEntity } from '../../domain/entities/financial-goal.entity';
import { GoalStatusVO } from '../../domain/value-objects/goal-status.vo';
import { FinancialGoal, GoalStatus, Prisma } from '@prisma/client';

@Injectable()
export class FinancialGoalRepositoryImpl implements IFinancialGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(goal: FinancialGoalEntity): Promise<FinancialGoalEntity> {
    const data: Prisma.FinancialGoalCreateInput = {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      status: goal.status.getValue(),
      client: { connect: { id: goal.clientId } },
      user: { connect: { id: goal.userId } },
      ...(goal.workspaceId && {
        workspace: { connect: { id: goal.workspaceId } },
      }),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };

    const created = await this.prisma.financialGoal.create({ data });
    return this.toDomain(created);
  }

  async update(goal: FinancialGoalEntity): Promise<FinancialGoalEntity> {
    const data: Prisma.FinancialGoalUpdateInput = {
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      status: goal.status.getValue(),
      updatedAt: goal.updatedAt,
    };

    const updated = await this.prisma.financialGoal.update({
      where: { id: goal.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<FinancialGoalEntity | null> {
    const goal = await this.prisma.financialGoal.findUnique({
      where: { id },
    });

    return goal ? this.toDomain(goal) : null;
  }

  async findByClientAndUser(
    clientId: string,
    userId: string,
    status?: GoalStatus,
  ): Promise<FinancialGoalEntity[]> {
    const goals = await this.prisma.financialGoal.findMany({
      where: {
        clientId,
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => this.toDomain(g));
  }

  async findByWorkspace(workspaceId: string, status?: GoalStatus): Promise<FinancialGoalEntity[]> {
    const goals = await this.prisma.financialGoal.findMany({
      where: {
        workspaceId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => this.toDomain(g));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financialGoal.delete({ where: { id } });
  }

  private toDomain(goal: FinancialGoal): FinancialGoalEntity {
    return FinancialGoalEntity.reconstitute({
      id: goal.id,
      title: goal.title,
      description: goal.description || undefined,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      status: GoalStatusVO.create(goal.status),
      clientId: goal.clientId,
      userId: goal.userId,
      workspaceId: goal.workspaceId || undefined,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    });
  }
}
