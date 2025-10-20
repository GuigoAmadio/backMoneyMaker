import { Decimal } from '@prisma/client/runtime/library';

export interface BudgetCategoryProps {
  id: string;
  budgetId: string;
  categoryId: string;
  amount: Decimal;
  spentAmount: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetCategoryEntity {
  private constructor(private props: BudgetCategoryProps) {}

  static create(
    props: Omit<BudgetCategoryProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): BudgetCategoryEntity {
    // Validações
    if (props.amount.lte(0)) {
      throw new Error('Budget category amount must be greater than zero');
    }

    if (props.spentAmount.lt(0)) {
      throw new Error('Spent amount cannot be negative');
    }

    return new BudgetCategoryEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BudgetCategoryProps): BudgetCategoryEntity {
    return new BudgetCategoryEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get budgetId(): string {
    return this.props.budgetId;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get amount(): Decimal {
    return this.props.amount;
  }

  get spentAmount(): Decimal {
    return this.props.spentAmount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods

  updateAmount(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Budget category amount must be greater than zero');
    }
    this.props.amount = amount;
    this.touch();
  }

  addSpending(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Spending amount must be greater than zero');
    }

    this.props.spentAmount = this.props.spentAmount.add(amount);
    this.touch();
  }

  subtractSpending(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Spending amount must be greater than zero');
    }

    const newSpent = this.props.spentAmount.sub(amount);
    if (newSpent.lt(0)) {
      throw new Error('Cannot subtract more than spent amount');
    }

    this.props.spentAmount = newSpent;
    this.touch();
  }

  getRemainingAmount(): Decimal {
    const remaining = this.props.amount.sub(this.props.spentAmount);
    return remaining.lt(0) ? new Decimal(0) : remaining;
  }

  getUsagePercentage(): number {
    return this.props.amount.gt(0)
      ? this.props.spentAmount.div(this.props.amount).mul(100).toNumber()
      : 0;
  }

  isOverBudget(): boolean {
    return this.props.spentAmount.gt(this.props.amount);
  }

  getOverBudgetAmount(): Decimal {
    if (!this.isOverBudget()) {
      return new Decimal(0);
    }
    return this.props.spentAmount.sub(this.props.amount);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): BudgetCategoryProps {
    return { ...this.props };
  }
}
