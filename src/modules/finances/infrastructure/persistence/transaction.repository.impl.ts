import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ITransactionRepository,
  TransactionFilters,
  PaginationParams,
  PaginatedResult,
} from '../../domain/repositories/transaction.repository';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { TransactionTypeVO } from '../../domain/value-objects/transaction-type.vo';
import { TransactionStatusVO } from '../../domain/value-objects/transaction-status.vo';
import { Transaction, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionRepositoryImpl implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(transaction: TransactionEntity): Promise<TransactionEntity> {
    const data: Prisma.TransactionCreateInput = {
      id: transaction.id,
      title: transaction.title,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type.getValue(),
      status: transaction.status.getValue(),
      date: transaction.date,
      isRecurring: transaction.isRecurring,
      tags: transaction.tags,
      recurringPattern: transaction.recurringPattern
        ? JSON.parse(JSON.stringify(transaction.recurringPattern))
        : undefined,
      client: { connect: { id: transaction.clientId } },
      user: { connect: { id: transaction.userId } },
      ...(transaction.workspaceId && {
        workspace: { connect: { id: transaction.workspaceId } },
      }),
      ...(transaction.categoryId && {
        category: { connect: { id: transaction.categoryId } },
      }),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    const created = await this.prisma.transaction.create({ data });
    return this.toDomain(created);
  }

  async update(transaction: TransactionEntity): Promise<TransactionEntity> {
    const data: Prisma.TransactionUpdateInput = {
      title: transaction.title,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type.getValue(),
      status: transaction.status.getValue(),
      date: transaction.date,
      isRecurring: transaction.isRecurring,
      tags: transaction.tags,
      recurringPattern: transaction.recurringPattern
        ? JSON.parse(JSON.stringify(transaction.recurringPattern))
        : undefined,
      updatedAt: transaction.updatedAt,
    };

    const updated = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    return transaction ? this.toDomain(transaction) : null;
  }

  async findByClientAndUser(
    clientId: string,
    userId: string,
    filters: TransactionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<TransactionEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause({ ...filters, clientId, userId });
    const orderBy = this.buildOrderBy(filters);

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map((t) => this.toDomain(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findByWorkspace(
    workspaceId: string,
    filters: TransactionFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<TransactionEntity>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause({ ...filters, workspaceId });
    const orderBy = this.buildOrderBy(filters);

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map((t) => this.toDomain(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } });
  }

  async getSummary(
    clientId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const where: any = {
      clientId,
      userId,
      status: 'CONFIRMED',
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [income, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = income._sum.amount || new Decimal(0);
    const totalExpenses = expenses._sum.amount || new Decimal(0);
    const balance = totalIncome.sub(totalExpenses);

    const categorySummary = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return {
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        incomeCount: income._count,
        expenseCount: expenses._count,
      },
      categorySummary,
    };
  }

  async getWorkspaceSummary(workspaceId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {
      workspaceId,
      status: 'CONFIRMED',
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [income, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = income._sum.amount || new Decimal(0);
    const totalExpenses = expenses._sum.amount || new Decimal(0);
    const balance = totalIncome.sub(totalExpenses);

    const userSummary = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const categorySummary = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    return {
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        incomeCount: income._count,
        expenseCount: expenses._count,
      },
      userSummary,
      categorySummary,
    };
  }

  async findRecurring(clientId: string, userId: string): Promise<TransactionEntity[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        clientId,
        userId,
        isRecurring: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => this.toDomain(t));
  }

  private buildWhereClause(filters: any): any {
    const where: any = {};

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.workspaceId) where.workspaceId = filters.workspaceId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(filters: TransactionFilters): any {
    const orderBy: any = {};
    orderBy[filters.sortBy || 'date'] = filters.sortOrder || 'desc';
    return orderBy;
  }

  private toDomain(transaction: Transaction): TransactionEntity {
    return TransactionEntity.reconstitute({
      id: transaction.id,
      title: transaction.title,
      description: transaction.description || undefined,
      amount: transaction.amount,
      type: TransactionTypeVO.create(transaction.type),
      status: TransactionStatusVO.create(transaction.status),
      date: transaction.date,
      isRecurring: transaction.isRecurring,
      tags: transaction.tags,
      recurringPattern: transaction.recurringPattern
        ? JSON.stringify(transaction.recurringPattern)
        : undefined,
      clientId: transaction.clientId,
      userId: transaction.userId,
      workspaceId: transaction.workspaceId || undefined,
      categoryId: transaction.categoryId || undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    });
  }
}
