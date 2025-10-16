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

import { GoalsBudgetsService } from './goals-budgets.service';
import {
  CreateFinancialGoalDto,
  CreateBudgetDto,
  CreateBudgetCategoryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { User } from '../../common/decorators/user.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CacheEventsService } from '../../cache-events/cache-events.service';
import { UserRole } from '@prisma/client';

@ApiTags('Metas e Orçamentos')
@Controller({ path: 'finances/goals-budgets', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class GoalsBudgetsController {
  private readonly logger = new Logger(GoalsBudgetsController.name);

  constructor(
    private readonly goalsBudgetsService: GoalsBudgetsService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  // ===== METAS FINANCEIRAS =====

  @Post('goals')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar nova meta financeira' })
  @ApiResponse({ status: 201, description: 'Meta financeira criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createFinancialGoal(
    @Body() createFinancialGoalDto: CreateFinancialGoalDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Criando meta financeira para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.goalsBudgetsService.createFinancialGoal(
      clientId,
      userId,
      createFinancialGoalDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'goals',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'goal_created' },
    });

    return result;
  }

  @Get('goals')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'goals:list',
    ttl: 300,
    tags: ['goals'],
  })
  @ApiOperation({ summary: 'Listar metas financeiras' })
  @ApiResponse({ status: 200, description: 'Lista de metas financeiras' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  async getFinancialGoals(
    @Query('status') status?: string,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Listando metas financeiras para clientId: ${clientId}, userId: ${userId}`);
    return this.goalsBudgetsService.getFinancialGoals(clientId, userId, { status });
  }

  @Patch('goals/:id/progress')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar progresso da meta' })
  @ApiResponse({ status: 200, description: 'Progresso atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Meta não encontrada' })
  async updateGoalProgress(
    @Param('id') goalId: string,
    @Body('amount') amount: number,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Atualizando progresso da meta ${goalId} com valor ${amount}`);

    const result = await this.goalsBudgetsService.updateGoalProgress(goalId, userId, amount);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'goals',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'goal_progress_updated' },
    });

    return result;
  }

  // ===== ORÇAMENTOS =====

  @Post('budgets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar novo orçamento' })
  @ApiResponse({ status: 201, description: 'Orçamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createBudget(
    @Body() createBudgetDto: CreateBudgetDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Criando orçamento para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.goalsBudgetsService.createBudget(
      clientId,
      userId,
      createBudgetDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'budgets',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'budget_created' },
    });

    return result;
  }

  @Get('budgets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'budgets:list',
    ttl: 300,
    tags: ['budgets'],
  })
  @ApiOperation({ summary: 'Listar orçamentos' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'period', required: false, description: 'Filtrar por período' })
  async getBudgets(
    @Query('status') status?: string,
    @Query('period') period?: string,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Listando orçamentos para clientId: ${clientId}, userId: ${userId}`);
    return this.goalsBudgetsService.getBudgets(clientId, userId, { status, period });
  }

  @Post('budgets/:id/categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Adicionar categoria ao orçamento' })
  @ApiResponse({ status: 201, description: 'Categoria adicionada com sucesso' })
  @ApiResponse({ status: 400, description: 'Categoria já existe no orçamento' })
  async addBudgetCategory(
    @Param('id') budgetId: string,
    @Body() createBudgetCategoryDto: CreateBudgetCategoryDto,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Adicionando categoria ao orçamento ${budgetId}`);

    const result = await this.goalsBudgetsService.addBudgetCategory(
      budgetId,
      userId,
      createBudgetCategoryDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'budgets',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'budget_category_added' },
    });

    return result;
  }

  @Patch('budgets/categories/:categoryId/spending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar gastos da categoria' })
  @ApiResponse({ status: 200, description: 'Gastos atualizados com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async updateCategorySpending(
    @Param('categoryId') categoryId: string,
    @Body('amount') amount: number,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Atualizando gastos da categoria ${categoryId} com valor ${amount}`);

    const result = await this.goalsBudgetsService.updateCategorySpending(
      categoryId,
      userId,
      amount,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'budgets',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'category_spending_updated' },
    });

    return result;
  }

  @Get('budgets/:id/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'budgets:summary',
    ttl: 300,
    tags: ['budgets'],
  })
  @ApiOperation({ summary: 'Obter resumo do orçamento' })
  @ApiResponse({ status: 200, description: 'Resumo do orçamento' })
  async getBudgetSummary(
    @Param('id') budgetId: string,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Gerando resumo do orçamento ${budgetId}`);
    return this.goalsBudgetsService.getBudgetSummary(budgetId, userId);
  }

  // ===== VISÃO GERAL =====

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'financial:overview',
    ttl: 300,
    tags: ['goals', 'budgets'],
  })
  @ApiOperation({ summary: 'Obter visão geral financeira' })
  @ApiResponse({ status: 200, description: 'Visão geral financeira' })
  async getFinancialOverview(
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Gerando visão geral financeira para clientId: ${clientId}, userId: ${userId}`);
    return this.goalsBudgetsService.getFinancialOverview(clientId, userId);
  }
}
