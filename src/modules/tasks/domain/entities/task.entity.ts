import { TaskPriorityVO } from '../value-objects/task-priority.vo';
import { TaskStatusVO } from '../value-objects/task-status.vo';
import { TaskTypeVO } from '../value-objects/task-type.vo';

export interface TaskProps {
  id: string;
  title: string;
  description?: string;
  type: TaskTypeVO;
  status: TaskStatusVO;
  priority: TaskPriorityVO;
  workspaceId: string;
  boardId?: string;
  columnId?: string;
  parentTaskId?: string;
  sprintId?: string;
  estimatedHours?: number;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  tags: string[];
  labels: string[];
  order: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskEntity {
  private constructor(private props: TaskProps) {}

  static create(props: Omit<TaskProps, 'id' | 'createdAt' | 'updatedAt'>): TaskEntity {
    return new TaskEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: TaskProps): TaskEntity {
    return new TaskEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): TaskTypeVO {
    return this.props.type;
  }

  get status(): TaskStatusVO {
    return this.props.status;
  }

  get priority(): TaskPriorityVO {
    return this.props.priority;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get boardId(): string | undefined {
    return this.props.boardId;
  }

  get columnId(): string | undefined {
    return this.props.columnId;
  }

  get parentTaskId(): string | undefined {
    return this.props.parentTaskId;
  }

  get sprintId(): string | undefined {
    return this.props.sprintId;
  }

  get estimatedHours(): number | undefined {
    return this.props.estimatedHours;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get labels(): string[] {
    return this.props.labels;
  }

  get order(): number {
    return this.props.order;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    this.props.title = title.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  changeStatus(newStatus: TaskStatusVO): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.props.status} to ${newStatus}`);
    }

    this.props.status = newStatus;

    if (newStatus.isDone()) {
      this.props.completedAt = new Date();
    } else {
      this.props.completedAt = undefined;
    }

    this.touch();
  }

  changePriority(newPriority: TaskPriorityVO): void {
    this.props.priority = newPriority;
    this.touch();
  }

  moveToColumn(columnId: string, order?: number): void {
    this.props.columnId = columnId;
    if (order !== undefined) {
      this.props.order = order;
    }
    this.touch();
  }

  assignToSprint(sprintId: string): void {
    this.props.sprintId = sprintId;
    this.touch();
  }

  removeFromSprint(): void {
    this.props.sprintId = undefined;
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    this.props.tags = this.props.tags.filter((t) => t !== tag);
    this.touch();
  }

  addLabel(label: string): void {
    if (!this.props.labels.includes(label)) {
      this.props.labels.push(label);
      this.touch();
    }
  }

  removeLabel(label: string): void {
    this.props.labels = this.props.labels.filter((l) => l !== label);
    this.touch();
  }

  setEstimatedHours(hours: number): void {
    if (hours < 0) {
      throw new Error('Estimated hours cannot be negative');
    }
    this.props.estimatedHours = hours;
    this.touch();
  }

  setDueDate(date: Date): void {
    this.props.dueDate = date;
    this.touch();
  }

  setStartDate(date: Date): void {
    this.props.startDate = date;
    this.touch();
  }

  isOverdue(): boolean {
    if (!this.props.dueDate || this.props.status.isDone()) {
      return false;
    }
    return this.props.dueDate < new Date();
  }

  isSubtask(): boolean {
    return !!this.props.parentTaskId;
  }

  canHaveSubtasks(): boolean {
    return this.props.type.isEpic() || !this.isSubtask();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): TaskProps {
    return { ...this.props };
  }
}

