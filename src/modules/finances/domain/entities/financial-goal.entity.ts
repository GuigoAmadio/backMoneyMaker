import { Decimal } from '@prisma/client/runtime/library';
import { GoalStatusVO } from '../value-objects/goal-status.vo';

export interface FinancialGoalProps {
  id: string;
  title: string;
  description?: string;
  targetAmount: Decimal;
  currentAmount: Decimal;
  targetDate: Date;
  status: GoalStatusVO;
  clientId: string;
  userId: string;
  workspaceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FinancialGoalEntity {
  private constructor(private props: FinancialGoalProps) {}

  static create(
    props: Omit<FinancialGoalProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): FinancialGoalEntity {
    // Validações
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Financial goal title cannot be empty');
    }

    if (props.targetAmount.lte(0)) {
      throw new Error('Target amount must be greater than zero');
    }

    if (props.currentAmount.lt(0)) {
      throw new Error('Current amount cannot be negative');
    }

    if (props.targetDate <= new Date()) {
      throw new Error('Target date must be in the future');
    }

    return new FinancialGoalEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: FinancialGoalProps): FinancialGoalEntity {
    return new FinancialGoalEntity(props);
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

  get targetAmount(): Decimal {
    return this.props.targetAmount;
  }

  get currentAmount(): Decimal {
    return this.props.currentAmount;
  }

  get targetDate(): Date {
    return this.props.targetDate;
  }

  get status(): GoalStatusVO {
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

  updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Financial goal title cannot be empty');
    }
    this.props.title = title.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  updateTargetAmount(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Target amount must be greater than zero');
    }
    this.props.targetAmount = amount;
    this.checkCompletion();
    this.touch();
  }

  updateTargetDate(date: Date): void {
    this.props.targetDate = date;
    this.touch();
  }

  addProgress(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Progress amount must be greater than zero');
    }

    if (this.props.status.isCompleted() || this.props.status.isCancelled()) {
      throw new Error('Cannot add progress to completed or cancelled goal');
    }

    this.props.currentAmount = this.props.currentAmount.add(amount);
    this.checkCompletion();
    this.touch();
  }

  subtractProgress(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Progress amount must be greater than zero');
    }

    const newAmount = this.props.currentAmount.sub(amount);
    if (newAmount.lt(0)) {
      throw new Error('Cannot subtract more than current amount');
    }

    this.props.currentAmount = newAmount;
    this.touch();
  }

  private checkCompletion(): void {
    if (this.props.currentAmount.gte(this.props.targetAmount) && this.props.status.isActive()) {
      this.complete();
    }
  }

  complete(): void {
    const completedStatus = GoalStatusVO.create('COMPLETED' as any);
    if (this.props.status.canTransitionTo(completedStatus)) {
      this.props.status = completedStatus;
      this.touch();
    }
  }

  cancel(): void {
    const cancelledStatus = GoalStatusVO.create('CANCELLED' as any);
    if (this.props.status.canTransitionTo(cancelledStatus)) {
      this.props.status = cancelledStatus;
      this.touch();
    }
  }

  getProgress(): number {
    return this.props.targetAmount.gt(0)
      ? this.props.currentAmount.div(this.props.targetAmount).mul(100).toNumber()
      : 0;
  }

  getRemainingAmount(): Decimal {
    const remaining = this.props.targetAmount.sub(this.props.currentAmount);
    return remaining.lt(0) ? new Decimal(0) : remaining;
  }

  getDaysRemaining(): number {
    const now = new Date();
    const diff = this.props.targetDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isOverdue(): boolean {
    return new Date() > this.props.targetDate && !this.props.status.isCompleted();
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

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): FinancialGoalProps {
    return { ...this.props };
  }
}
