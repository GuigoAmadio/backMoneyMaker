import { TaskPriority } from '@prisma/client';

export class TaskPriorityVO {
  private constructor(private readonly value: TaskPriority) {}

  static create(value: TaskPriority): TaskPriorityVO {
    if (!Object.values(TaskPriority).includes(value)) {
      throw new Error(`Invalid task priority: ${value}`);
    }
    return new TaskPriorityVO(value);
  }

  static fromString(value: string): TaskPriorityVO {
    const priority = value.toUpperCase() as TaskPriority;
    return this.create(priority);
  }

  getValue(): TaskPriority {
    return this.value;
  }

  isHigherThan(other: TaskPriorityVO): boolean {
    const priorities = [
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.CRITICAL,
      TaskPriority.URGENT,
    ];
    return priorities.indexOf(this.value) > priorities.indexOf(other.value);
  }

  equals(other: TaskPriorityVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

