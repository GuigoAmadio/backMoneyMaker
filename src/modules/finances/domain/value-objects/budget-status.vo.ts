import { BudgetStatus as PrismaBudgetStatus } from '@prisma/client';

export class BudgetStatusVO {
  private constructor(private readonly value: PrismaBudgetStatus) {}

  static create(value: PrismaBudgetStatus): BudgetStatusVO {
    if (!Object.values(PrismaBudgetStatus).includes(value)) {
      throw new Error(`Invalid budget status: ${value}`);
    }
    return new BudgetStatusVO(value);
  }

  getValue(): PrismaBudgetStatus {
    return this.value;
  }

  isActive(): boolean {
    return this.value === PrismaBudgetStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.value === PrismaBudgetStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === PrismaBudgetStatus.CANCELLED;
  }

  canTransitionTo(newStatus: BudgetStatusVO): boolean {
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

  equals(other: BudgetStatusVO): boolean {
    return this.value === other.value;
  }
}
