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
import { CreateBudgetUseCase } from '../application/use-cases/budget/create-budget.use-case';
import { AddBudgetCategoryUseCase } from '../application/use-cases/budget/add-budget-category.use-case';
import { IBudgetRepository } from '../domain/repositories/budget.repository';
import { CreateBudgetDto, CreateBudgetCategoryDto } from '../dto';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finances/budgets', version: '1' })
export class BudgetsController {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly addBudgetCategoryUseCase: AddBudgetCategoryUseCase,
    @Inject('BUDGET_REPOSITORY')
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar orçamento' })
  async create(@Req() req: any, @Body() dto: CreateBudgetDto) {
    const budget = await this.createBudgetUseCase.execute({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      clientId: req.user.clientId,
      userId: req.user.userId,
    });

    return {
      success: true,
      message: 'Orçamento criado com sucesso',
      data: budget.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar orçamentos' })
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('period') period?: string,
  ) {
    const budgets = await this.budgetRepository.findByClientAndUser(
      req.user.clientId,
      req.user.userId,
      {
        status: status as any,
        period: period as any,
      },
    );

    return {
      success: true,
      data: budgets.map((b) => b.toPlainObject()),
      message: 'Orçamentos listados com sucesso',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  async findOne(@Param('id') id: string) {
    const budget = await this.budgetRepository.findById(id);

    if (!budget) {
      return {
        success: false,
        message: 'Orçamento não encontrado',
      };
    }

    return {
      success: true,
      data: budget.toPlainObject(),
    };
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumo do orçamento' })
  async getSummary(@Param('id') budgetId: string) {
    const summary = await this.budgetRepository.getSummary(budgetId);

    if (!summary) {
      return {
        success: false,
        message: 'Orçamento não encontrado',
      };
    }

    return {
      success: true,
      data: summary,
      message: 'Resumo do orçamento gerado com sucesso',
    };
  }

  @Post(':id/categories')
  @ApiOperation({ summary: 'Adicionar categoria ao orçamento' })
  async addCategory(@Param('id') budgetId: string, @Body() dto: CreateBudgetCategoryDto) {
    const budgetCategory = await this.addBudgetCategoryUseCase.execute({
      budgetId,
      ...dto,
    });

    return {
      success: true,
      message: 'Categoria adicionada ao orçamento com sucesso',
      data: budgetCategory.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar orçamento' })
  async delete(@Param('id') id: string) {
    await this.budgetRepository.delete(id);
  }
}
