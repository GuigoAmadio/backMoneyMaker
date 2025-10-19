import { TaskType } from '@prisma/client';

export class TaskTypeVO {
  private constructor(private readonly value: TaskType) {}

  static create(value: TaskType): TaskTypeVO {
    if (!Object.values(TaskType).includes(value)) {
      throw new Error(`Invalid task type: ${value}`);
    }
    return new TaskTypeVO(value);
  }

  static fromString(value: string): TaskTypeVO {
    const type = value.toUpperCase() as TaskType;
    return this.create(type);
  }

  getValue(): TaskType {
    return this.value;
  }

  isEpic(): boolean {
    return this.value === TaskType.EPIC;
  }

  isBug(): boolean {
    return this.value === TaskType.BUG;
  }

  isFeature(): boolean {
    return this.value === TaskType.FEATURE;
  }

  equals(other: TaskTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

