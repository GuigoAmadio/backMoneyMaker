import { GoalStatus as PrismaGoalStatus } from '@prisma/client';

export class GoalStatusVO {
  private constructor(private readonly value: PrismaGoalStatus) {}

  static create(value: PrismaGoalStatus): GoalStatusVO {
    if (!Object.values(PrismaGoalStatus).includes(value)) {
      throw new Error(`Invalid goal status: ${value}`);
    }
    return new GoalStatusVO(value);
  }

  getValue(): PrismaGoalStatus {
    return this.value;
  }

  isActive(): boolean {
    return this.value === PrismaGoalStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.value === PrismaGoalStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === PrismaGoalStatus.CANCELLED;
  }

  canTransitionTo(newStatus: GoalStatusVO): boolean {
    // ACTIVE -> COMPLETED or CANCELLED
    if (this.isActive()) {
      return newStatus.isCompleted() || newStatus.isCancelled();
    }

    // COMPLETED e CANCELLED não podem mudar
    return false;
  }

  toString(): string {
    return this.value;
  }

  equals(other: GoalStatusVO): boolean {
    return this.value === other.value;
  }
}
