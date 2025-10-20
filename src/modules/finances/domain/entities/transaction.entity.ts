import { Decimal } from '@prisma/client/runtime/library';
import { TransactionTypeVO } from '../value-objects/transaction-type.vo';
import { TransactionStatusVO } from '../value-objects/transaction-status.vo';

export interface TransactionProps {
  id: string;
  title: string;
  description?: string;
  amount: Decimal;
  type: TransactionTypeVO;
  status: TransactionStatusVO;
  date: Date;
  isRecurring: boolean;
  tags: string[];
  recurringPattern?: string;
  clientId: string;
  userId: string;
  workspaceId?: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionEntity {
  private constructor(private props: TransactionProps) {}

  static create(
    props: Omit<TransactionProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): TransactionEntity {
    // Validações
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Transaction title cannot be empty');
    }

    if (props.amount.lte(0)) {
      throw new Error('Transaction amount must be greater than zero');
    }

    return new TransactionEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: TransactionProps): TransactionEntity {
    return new TransactionEntity(props);
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

  get amount(): Decimal {
    return this.props.amount;
  }

  get type(): TransactionTypeVO {
    return this.props.type;
  }

  get status(): TransactionStatusVO {
    return this.props.status;
  }

  get date(): Date {
    return this.props.date;
  }

  get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get recurringPattern(): string | undefined {
    return this.props.recurringPattern;
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

  get categoryId(): string | undefined {
    return this.props.categoryId;
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
      throw new Error('Transaction title cannot be empty');
    }
    this.props.title = title.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  updateAmount(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new Error('Transaction amount must be greater than zero');
    }
    this.props.amount = amount;
    this.touch();
  }

  updateDate(date: Date): void {
    this.props.date = date;
    this.touch();
  }

  changeStatus(newStatus: TransactionStatusVO): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.props.status} to ${newStatus}`);
    }
    this.props.status = newStatus;
    this.touch();
  }

  confirm(): void {
    const confirmedStatus = TransactionStatusVO.create('CONFIRMED' as any);
    this.changeStatus(confirmedStatus);
  }

  cancel(): void {
    const cancelledStatus = TransactionStatusVO.create('CANCELLED' as any);
    this.changeStatus(cancelledStatus);
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.touch();
    }
  }

  setCategory(categoryId: string): void {
    this.props.categoryId = categoryId;
    this.touch();
  }

  removeCategory(): void {
    this.props.categoryId = undefined;
    this.touch();
  }

  isIncome(): boolean {
    return this.props.type.isIncome();
  }

  isExpense(): boolean {
    return this.props.type.isExpense();
  }

  isPending(): boolean {
    return this.props.status.isPending();
  }

  isConfirmed(): boolean {
    return this.props.status.isConfirmed();
  }

  isCancelled(): boolean {
    return this.props.status.isCancelled();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): TransactionProps {
    return { ...this.props };
  }
}
