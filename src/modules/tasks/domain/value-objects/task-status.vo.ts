import { TaskStatus } from '@prisma/client';

export class TaskStatusVO {
  private constructor(private readonly value: TaskStatus) {}

  static create(value: TaskStatus): TaskStatusVO {
    if (!Object.values(TaskStatus).includes(value)) {
      throw new Error(`Invalid task status: ${value}`);
    }
    return new TaskStatusVO(value);
  }

  static fromString(value: string): TaskStatusVO {
    const status = value.toUpperCase() as TaskStatus;
    return this.create(status);
  }

  getValue(): TaskStatus {
    return this.value;
  }

  isTodo(): boolean {
    return this.value === TaskStatus.TODO;
  }

  isInProgress(): boolean {
    return this.value === TaskStatus.IN_PROGRESS;
  }

  isDone(): boolean {
    return this.value === TaskStatus.DONE;
  }

  isBlocked(): boolean {
    return this.value === TaskStatus.BLOCKED;
  }

  isCancelled(): boolean {
    return this.value === TaskStatus.CANCELLED;
  }

  canTransitionTo(newStatus: TaskStatusVO): boolean {
    // Definir regras de transição
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [
        TaskStatus.IN_REVIEW,
        TaskStatus.BLOCKED,
        TaskStatus.DONE,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.IN_REVIEW]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CANCELLED],
      [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.DONE]: [],
      [TaskStatus.CANCELLED]: [TaskStatus.TODO],
    };

    return validTransitions[this.value]?.includes(newStatus.getValue()) ?? false;
  }

  equals(other: TaskStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

