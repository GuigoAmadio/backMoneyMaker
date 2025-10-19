import { SprintStatus } from '@prisma/client';

export class SprintStatusVO {
  private constructor(private readonly value: SprintStatus) {}

  static create(value: SprintStatus): SprintStatusVO {
    if (!Object.values(SprintStatus).includes(value)) {
      throw new Error(`Invalid sprint status: ${value}`);
    }
    return new SprintStatusVO(value);
  }

  static fromString(value: string): SprintStatusVO {
    const status = value.toUpperCase() as SprintStatus;
    return this.create(status);
  }

  getValue(): SprintStatus {
    return this.value;
  }

  isPlanned(): boolean {
    return this.value === SprintStatus.PLANNED;
  }

  isActive(): boolean {
    return this.value === SprintStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.value === SprintStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.value === SprintStatus.CANCELLED;
  }

  canTransitionTo(newStatus: SprintStatusVO): boolean {
    const validTransitions: Record<SprintStatus, SprintStatus[]> = {
      [SprintStatus.PLANNED]: [SprintStatus.ACTIVE, SprintStatus.CANCELLED],
      [SprintStatus.ACTIVE]: [SprintStatus.COMPLETED, SprintStatus.CANCELLED],
      [SprintStatus.COMPLETED]: [],
      [SprintStatus.CANCELLED]: [],
    };

    return validTransitions[this.value]?.includes(newStatus.getValue()) ?? false;
  }

  equals(other: SprintStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

