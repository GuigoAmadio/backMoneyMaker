import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITransactionRepository } from '../../../domain/repositories/transaction.repository';
import { TransactionEntity } from '../../../domain/entities/transaction.entity';
import { Decimal } from '@prisma/client/runtime/library';

export interface UpdateTransactionInput {
  id: string;
  title?: string;
  description?: string;
  amount?: number | Decimal;
  date?: Date;
  tags?: string[];
}

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: UpdateTransactionInput): Promise<TransactionEntity> {
    const transaction = await this.transactionRepository.findById(input.id);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (input.title) transaction.updateTitle(input.title);
    if (input.description !== undefined) transaction.updateDescription(input.description);
    if (input.amount) transaction.updateAmount(new Decimal(input.amount));
    if (input.date) transaction.updateDate(input.date);

    return await this.transactionRepository.update(transaction);
  }
}
