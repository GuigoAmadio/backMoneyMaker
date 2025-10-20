import { Decimal } from '@prisma/client/runtime/library';
import { BudgetStatusVO } from '../value-objects/budget-status.vo';
import { BudgetPeriod } from '@prisma/client';

export interface BudgetProps {
  id: string;
  name: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  status: BudgetStatusVO;
  clientId: string;
  userId: string;
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetEntity {
  private constructor(private props: BudgetProps) {}

  static create(props: Omit<BudgetProps, 'id' | 'createdAt' | 'updatedAt'>): BudgetEntity {
    // Validações
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Budget name cannot be empty');
    }

    if (props.startDate >= props.endDate) {
      throw new Error('Start date must be before end date');
    }

    return new BudgetEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BudgetProps): BudgetEntity {
    return new BudgetEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get period(): BudgetPeriod {
    return this.props.period;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get status(): BudgetStatusVO {
    return this.props.status;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get workspaceId(): string | undefined {
    return this.props.workspaceId;
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
      throw new Error('Budget name cannot be empty');
    }
    this.props.name = name.trim();
    this.touch();
  }

  updateDates(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    this.props.startDate = startDate;
    this.props.endDate = endDate;
    this.touch();
  }

  complete(): void {
    const completedStatus = BudgetStatusVO.create('COMPLETED' as any);
    if (this.props.status.canTransitionTo(completedStatus)) {
      this.props.status = completedStatus;
      this.touch();
    }
  }

  cancel(): void {
    const cancelledStatus = BudgetStatusVO.create('CANCELLED' as any);
    if (this.props.status.canTransitionTo(cancelledStatus)) {
      this.props.status = cancelledStatus;
      this.touch();
    }
  }

  isActive(): boolean {
    return this.props.status.isActive();
  }

  isCompleted(): boolean {
    return this.props.status.isCompleted();
  }

  isCancelled(): boolean {
    return this.props.status.isCancelled();
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

  toPlainObject(): BudgetProps {
    return { ...this.props };
  }
}
