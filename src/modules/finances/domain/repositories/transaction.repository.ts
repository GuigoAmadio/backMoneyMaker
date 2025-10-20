import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionType, TransactionStatus } from '@prisma/client';

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ITransactionRepository {
  create(transaction: TransactionEntity): Promise<TransactionEntity>;
  update(transaction: TransactionEntity): Promise<TransactionEntity>;
  findById(id: string): Promise<TransactionEntity | null>;
  findByClientAndUser(
    clientId: string,
    userId: string,
    filters: TransactionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<TransactionEntity>>;
  findByWorkspace(
    workspaceId: string,
    filters: TransactionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<TransactionEntity>>;
  delete(id: string): Promise<void>;
  getSummary(clientId: string, userId: string, startDate?: Date, endDate?: Date): Promise<any>;
  getWorkspaceSummary(workspaceId: string, startDate?: Date, endDate?: Date): Promise<any>;
  findRecurring(clientId: string, userId: string): Promise<TransactionEntity[]>;
}
