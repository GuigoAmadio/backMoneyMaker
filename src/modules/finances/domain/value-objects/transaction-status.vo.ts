import { TransactionStatus as PrismaTransactionStatus } from '@prisma/client';

export class TransactionStatusVO {
  private constructor(private readonly value: PrismaTransactionStatus) {}

  static create(value: PrismaTransactionStatus): TransactionStatusVO {
    if (!Object.values(PrismaTransactionStatus).includes(value)) {
      throw new Error(`Invalid transaction status: ${value}`);
    }
    return new TransactionStatusVO(value);
  }

  getValue(): PrismaTransactionStatus {
    return this.value;
  }

  isPending(): boolean {
    return this.value === PrismaTransactionStatus.PENDING;
  }

  isConfirmed(): boolean {
    return this.value === PrismaTransactionStatus.CONFIRMED;
  }

  isCancelled(): boolean {
    return this.value === PrismaTransactionStatus.CANCELLED;
  }

  canTransitionTo(newStatus: TransactionStatusVO): boolean {
    // PENDING -> CONFIRMED or CANCELLED
    if (this.isPending()) {
      return newStatus.isConfirmed() || newStatus.isCancelled();
    }

    // CONFIRMED -> CANCELLED (apenas se necessário)
    if (this.isConfirmed()) {
      return newStatus.isCancelled();
    }

    // CANCELLED não pode mudar
    return false;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TransactionStatusVO): boolean {
    return this.value === other.value;
  }
}
