import { TransactionType as PrismaTransactionType } from '@prisma/client';

export class TransactionTypeVO {
  private constructor(private readonly value: PrismaTransactionType) {}

  static create(value: PrismaTransactionType): TransactionTypeVO {
    if (!Object.values(PrismaTransactionType).includes(value)) {
      throw new Error(`Invalid transaction type: ${value}`);
    }
    return new TransactionTypeVO(value);
  }

  getValue(): PrismaTransactionType {
    return this.value;
  }

  isIncome(): boolean {
    return this.value === PrismaTransactionType.INCOME;
  }

  isExpense(): boolean {
    return this.value === PrismaTransactionType.EXPENSE;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TransactionTypeVO): boolean {
    return this.value === other.value;
  }
}
