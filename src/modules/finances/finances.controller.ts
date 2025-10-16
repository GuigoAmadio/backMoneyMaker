import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';

import { FinancesService } from './finances.service';
import { CreateTransactionDto, UpdateTransactionDto, GetTransactionsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { User } from '../../common/decorators/user.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CacheEventsService } from '../../cache-events/cache-events.service';
import { UserRole } from '@prisma/client';

@ApiTags('Finanças')
@Controller({ path: 'finances', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class FinancesController {
  private readonly logger = new Logger(FinancesController.name);

  constructor(
    private readonly financesService: FinancesService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  @Post('transactions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar nova transação financeira' })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Criando transação para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.financesService.create(clientId, userId, createTransactionDto);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'finances',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'transaction_created' },
    });

    return result;
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'finances:transactions:list',
    ttl: 300,
    tags: ['finances'],
  })
  @ApiOperation({ summary: 'Listar transações financeiras' })
  @ApiResponse({ status: 200, description: 'Lista de transações' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Tipo da transação',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    description: 'Status da transação',
  })
  @ApiQuery({ name: 'category', required: false, description: 'Categoria da transação' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por título ou descrição',
  })
  async getTransactions(
    @Query() filters: GetTransactionsDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Listando transações para clientId: ${clientId}, userId: ${userId}`);
    return this.financesService.findAll(clientId, userId, filters);
  }

  @Get('transactions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'finances:transactions:detail',
    ttl: 600,
    tags: ['finances'],
  })
  @ApiOperation({ summary: 'Buscar transação por ID' })
  @ApiResponse({ status: 200, description: 'Transação encontrada' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  async getTransaction(
    @Param('id') id: string,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Buscando transação ${id} para clientId: ${clientId}, userId: ${userId}`);
    return this.financesService.findOne(clientId, userId, id);
  }

  @Patch('transactions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar transação' })
  @ApiResponse({ status: 200, description: 'Transação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Atualizando transação ${id} para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.financesService.update(clientId, userId, id, updateTransactionDto);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'finances',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'transaction_updated' },
    });

    return result;
  }

  @Delete('transactions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Deletar transação' })
  @ApiResponse({ status: 200, description: 'Transação deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  async deleteTransaction(
    @Param('id') id: string,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Deletando transação ${id} para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.financesService.remove(clientId, userId, id);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'finances',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'transaction_deleted' },
    });

    return result;
  }

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'finances:summary',
    ttl: 300,
    tags: ['finances'],
  })
  @ApiOperation({ summary: 'Obter resumo financeiro' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final' })
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Gerando resumo financeiro para clientId: ${clientId}, userId: ${userId}`);
    return this.financesService.getSummary(clientId, userId, startDate, endDate);
  }

  @Get('recurring')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'finances:recurring',
    ttl: 600,
    tags: ['finances'],
  })
  @ApiOperation({ summary: 'Listar transações recorrentes' })
  @ApiResponse({ status: 200, description: 'Lista de transações recorrentes' })
  async getRecurringTransactions(@Tenant() clientId: string, @User('id') userId: string) {
    this.logger.log(
      `Listando transações recorrentes para clientId: ${clientId}, userId: ${userId}`,
    );
    return this.financesService.getRecurringTransactions(clientId, userId);
  }
}
