import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, GetTransactionsDto } from './dto';
import {
  TransactionType,
  TransactionStatus,
  TransactionCategory,
} from './dto/create-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinancesService {
  private readonly logger = new Logger(FinancesService.name);

  constructor(private prisma: PrismaService) {}

  async create(clientId: string, userId: string, createTransactionDto: CreateTransactionDto) {
    this.logger.log(
      `Criando transação para clientId: ${clientId}, userId: ${userId}, título: ${createTransactionDto.title}`,
    );

    try {
      // Verificar se a categoria existe e pertence ao cliente
      let categoryId = null;
      if (createTransactionDto.category) {
        const category = await this.prisma.category.findFirst({
          where: {
            clientId,
            name: createTransactionDto.category,
            type: 'financial',
          },
        });

        if (!category) {
          // Criar categoria financeira se não existir
          const newCategory = await this.prisma.category.create({
            data: {
              clientId,
              name: createTransactionDto.category,
              type: 'financial',
              description: `Categoria financeira: ${createTransactionDto.category}`,
            },
          });
          categoryId = newCategory.id;
        } else {
          categoryId = category.id;
        }
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          title: createTransactionDto.title,
          description: createTransactionDto.description,
          amount: createTransactionDto.amount,
          type: createTransactionDto.type,
          status: createTransactionDto.status || 'CONFIRMED',
          date: new Date(createTransactionDto.date),
          isRecurring: createTransactionDto.isRecurring || false,
          tags: createTransactionDto.tags || [],
          recurringPattern: createTransactionDto.recurringPattern,
          clientId,
          userId,
          categoryId,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Transação criada com sucesso: ${transaction.id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Transação criada com sucesso',
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar transação para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findAll(clientId: string, userId: string, filters: GetTransactionsDto) {
    this.logger.log(`Listando transações para clientId: ${clientId}, userId: ${userId}`);

    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        category,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        sortBy = 'date',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        clientId,
        userId,
      };

      if (type) where.type = type;
      if (status) where.status = status;
      if (category) where.category = category;

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        where.amount = {};
        if (minAmount !== undefined) where.amount.gte = minAmount;
        if (maxAmount !== undefined) where.amount.lte = maxAmount;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Construir ordenação
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [transactions, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.transaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Encontradas ${transactions.length} transações para clientId: ${clientId}`);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        message: 'Transações listadas com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao listar transações para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findOne(clientId: string, userId: string, id: string) {
    this.logger.log(`Buscando transação ${id} para clientId: ${clientId}, userId: ${userId}`);

    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          id,
          clientId,
          userId,
        },
      });

      if (!transaction) {
        this.logger.warn(`Transação não encontrada: ${id} para clientId: ${clientId}`);
        throw new NotFoundException('Transação não encontrada');
      }

      this.logger.log(`Transação encontrada: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar transação ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async update(
    clientId: string,
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    this.logger.log(`Atualizando transação ${id} para clientId: ${clientId}, userId: ${userId}`);

    try {
      const existingTransaction = await this.prisma.transaction.findFirst({
        where: { id, clientId, userId },
      });

      if (!existingTransaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      const updateData: any = { ...updateTransactionDto };
      if (updateTransactionDto.date) {
        updateData.date = new Date(updateTransactionDto.date);
      }

      const updatedTransaction = await this.prisma.transaction.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Transação atualizada com sucesso: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Transação atualizada com sucesso',
        data: updatedTransaction,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar transação ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async remove(clientId: string, userId: string, id: string) {
    this.logger.log(`Removendo transação ${id} para clientId: ${clientId}, userId: ${userId}`);

    try {
      const existingTransaction = await this.prisma.transaction.findFirst({
        where: { id, clientId, userId },
      });

      if (!existingTransaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      await this.prisma.transaction.delete({
        where: { id },
      });

      this.logger.log(`Transação removida com sucesso: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Transação removida com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao remover transação ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async getSummary(clientId: string, userId: string, startDate?: string, endDate?: string) {
    this.logger.log(`Gerando resumo financeiro para clientId: ${clientId}, userId: ${userId}`);

    try {
      const where: any = {
        clientId,
        userId,
        status: TransactionStatus.CONFIRMED,
      };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const [income, expenses] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalIncome = income._sum.amount || new Decimal(0);
      const totalExpenses = expenses._sum.amount || new Decimal(0);
      const balance = totalIncome.sub(totalExpenses);

      // Resumo por categoria
      const categorySummary = await this.prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where,
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });

      this.logger.log(`Resumo financeiro gerado para clientId: ${clientId}`);

      return {
        success: true,
        data: {
          summary: {
            totalIncome,
            totalExpenses,
            balance,
            incomeCount: income._count,
            expenseCount: expenses._count,
          },
          categorySummary,
        },
        message: 'Resumo financeiro gerado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar resumo financeiro para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async getRecurringTransactions(clientId: string, userId: string) {
    this.logger.log(
      `Listando transações recorrentes para clientId: ${clientId}, userId: ${userId}`,
    );

    try {
      const recurringTransactions = await this.prisma.transaction.findMany({
        where: {
          clientId,
          userId,
          isRecurring: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(
        `Encontradas ${recurringTransactions.length} transações recorrentes para clientId: ${clientId}`,
      );

      return {
        success: true,
        data: recurringTransactions,
        message: 'Transações recorrentes listadas com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao listar transações recorrentes para clientId: ${clientId}`, error);
      throw error;
    }
  }
}
