import { Injectable, Inject } from '@nestjs/common';
import {
  ITransactionRepository,
  TransactionFilters,
  PaginationParams,
  PaginatedResult,
} from '../../../domain/repositories/transaction.repository';
import { TransactionEntity } from '../../../domain/entities/transaction.entity';

export interface GetTransactionsInput {
  clientId: string;
  userId: string;
  filters: TransactionFilters;
  pagination: PaginationParams;
}

@Injectable()
export class GetTransactionsUseCase {
  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: GetTransactionsInput): Promise<PaginatedResult<TransactionEntity>> {
    return await this.transactionRepository.findByClientAndUser(
      input.clientId,
      input.userId,
      input.filters,
      input.pagination,
    );
  }
}
