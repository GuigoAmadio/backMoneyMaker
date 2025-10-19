import { SprintStatusVO } from '../value-objects/sprint-status.vo';

export interface SprintProps {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  workspaceId: string;
  status: SprintStatusVO;
  createdAt: Date;
  updatedAt: Date;
}

export class SprintEntity {
  private constructor(private props: SprintProps) {}

  static create(props: Omit<SprintProps, 'id' | 'createdAt' | 'updatedAt'>): SprintEntity {
    // Validações
    if (props.startDate >= props.endDate) {
      throw new Error('Start date must be before end date');
    }

    return new SprintEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: SprintProps): SprintEntity {
    return new SprintEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get goal(): string | undefined {
    return this.props.goal;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get status(): SprintStatusVO {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Sprint name cannot be empty');
    }
    this.props.name = name.trim();
    this.touch();
  }

  updateGoal(goal?: string): void {
    this.props.goal = goal?.trim();
    this.touch();
  }

  updateDates(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    if (this.props.status.isActive() && startDate > new Date()) {
      throw new Error('Cannot set start date in the future for active sprint');
    }

    this.props.startDate = startDate;
    this.props.endDate = endDate;
    this.touch();
  }

  changeStatus(newStatus: SprintStatusVO): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.props.status} to ${newStatus}`);
    }

    this.props.status = newStatus;
    this.touch();
  }

  start(): void {
    const activeStatus = SprintStatusVO.create('ACTIVE' as any);
    this.changeStatus(activeStatus);
  }

  complete(): void {
    const completedStatus = SprintStatusVO.create('COMPLETED' as any);
    this.changeStatus(completedStatus);
  }

  cancel(): void {
    const cancelledStatus = SprintStatusVO.create('CANCELLED' as any);
    this.changeStatus(cancelledStatus);
  }

  isActive(): boolean {
    return this.props.status.isActive();
  }

  isOngoing(): boolean {
    const now = new Date();
    return this.props.status.isActive() && this.props.startDate <= now && this.props.endDate >= now;
  }

  getDuration(): number {
    return Math.ceil(
      (this.props.endDate.getTime() - this.props.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  getDaysRemaining(): number {
    if (!this.isActive()) {
      return 0;
    }

    const now = new Date();
    const diff = this.props.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): SprintProps {
    return { ...this.props };
  }
}

