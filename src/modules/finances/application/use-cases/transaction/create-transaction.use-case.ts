import { Injectable, Inject } from '@nestjs/common';
import { TransactionEntity } from '../../../domain/entities/transaction.entity';
import { ITransactionRepository } from '../../../domain/repositories/transaction.repository';
import { TransactionTypeVO } from '../../../domain/value-objects/transaction-type.vo';
import { TransactionStatusVO } from '../../../domain/value-objects/transaction-status.vo';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionType, TransactionStatus } from '@prisma/client';

export interface CreateTransactionInput {
  title: string;
  description?: string;
  amount: number | Decimal;
  type: TransactionType;
  status?: TransactionStatus;
  date: Date;
  isRecurring?: boolean;
  tags?: string[];
  recurringPattern?: string;
  clientId: string;
  userId: string;
  workspaceId?: string;
  categoryId?: string;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionEntity> {
    const transaction = TransactionEntity.create({
      title: input.title,
      description: input.description,
      amount: new Decimal(input.amount),
      type: TransactionTypeVO.create(input.type),
      status: TransactionStatusVO.create(input.status || TransactionStatus.CONFIRMED),
      date: input.date,
      isRecurring: input.isRecurring || false,
      tags: input.tags || [],
      recurringPattern: input.recurringPattern,
      clientId: input.clientId,
      userId: input.userId,
      workspaceId: input.workspaceId,
      categoryId: input.categoryId,
    });

    return await this.transactionRepository.create(transaction);
  }
}
