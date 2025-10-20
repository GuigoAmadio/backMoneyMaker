import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateTransactionUseCase } from '../application/use-cases/transaction/create-transaction.use-case';
import { UpdateTransactionUseCase } from '../application/use-cases/transaction/update-transaction.use-case';
import { GetTransactionsUseCase } from '../application/use-cases/transaction/get-transactions.use-case';
import { ITransactionRepository } from '../domain/repositories/transaction.repository';
import { CreateTransactionDto, UpdateTransactionDto, GetTransactionsDto } from '../dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finances/transactions', version: '1' })
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova transação' })
  async create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    const transaction = await this.createTransactionUseCase.execute({
      ...dto,
      date: new Date(dto.date),
      clientId: req.user.clientId,
      userId: req.user.userId,
    });

    return {
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações' })
  async findAll(@Req() req: any, @Query() filters: GetTransactionsDto) {
    const result = await this.getTransactionsUseCase.execute({
      clientId: req.user.clientId,
      userId: req.user.userId,
      filters: {
        type: filters.type,
        status: filters.status,
        category: filters.category,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
      },
    });

    return {
      success: true,
      data: {
        transactions: result.data.map((t) => t.toPlainObject()),
        pagination: result.pagination,
      },
      message: 'Transações listadas com sucesso',
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  async getSummary(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const summary = await this.transactionRepository.getSummary(
      req.user.clientId,
      req.user.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: summary,
      message: 'Resumo financeiro gerado com sucesso',
    };
  }

  @Get('recurring')
  @ApiOperation({ summary: 'Listar transações recorrentes' })
  async getRecurring(@Req() req: any) {
    const transactions = await this.transactionRepository.findRecurring(
      req.user.clientId,
      req.user.userId,
    );

    return {
      success: true,
      data: transactions.map((t) => t.toPlainObject()),
      message: 'Transações recorrentes listadas com sucesso',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  async findOne(@Param('id') id: string) {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      return {
        success: false,
        message: 'Transação não encontrada',
      };
    }

    return {
      success: true,
      data: transaction.toPlainObject(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  async update(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    const transaction = await this.updateTransactionUseCase.execute({
      id,
      ...dto,
      ...(dto.date && { date: new Date(dto.date) }),
    });

    return {
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transaction.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar transação' })
  async delete(@Param('id') id: string) {
    await this.transactionRepository.delete(id);
  }
}
