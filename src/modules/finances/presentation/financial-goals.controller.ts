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
import { CreateFinancialGoalUseCase } from '../application/use-cases/financial-goal/create-financial-goal.use-case';
import { UpdateGoalProgressUseCase } from '../application/use-cases/financial-goal/update-goal-progress.use-case';
import { IFinancialGoalRepository } from '../domain/repositories/financial-goal.repository';
import { CreateFinancialGoalDto } from '../dto';

@ApiTags('Financial Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finances/goals', version: '1' })
export class FinancialGoalsController {
  constructor(
    private readonly createFinancialGoalUseCase: CreateFinancialGoalUseCase,
    private readonly updateGoalProgressUseCase: UpdateGoalProgressUseCase,
    @Inject('FINANCIAL_GOAL_REPOSITORY')
    private readonly financialGoalRepository: IFinancialGoalRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar meta financeira' })
  async create(@Req() req: any, @Body() dto: CreateFinancialGoalDto) {
    const goal = await this.createFinancialGoalUseCase.execute({
      ...dto,
      targetDate: new Date(dto.targetDate),
      clientId: req.user.clientId,
      userId: req.user.userId,
    });

    return {
      success: true,
      message: 'Meta financeira criada com sucesso',
      data: goal.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar metas financeiras' })
  async findAll(@Req() req: any, @Query('status') status?: string) {
    const goals = await this.financialGoalRepository.findByClientAndUser(
      req.user.clientId,
      req.user.userId,
      status as any,
    );

    return {
      success: true,
      data: goals.map((g) => g.toPlainObject()),
      message: 'Metas financeiras listadas com sucesso',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar meta financeira por ID' })
  async findOne(@Param('id') id: string) {
    const goal = await this.financialGoalRepository.findById(id);

    if (!goal) {
      return {
        success: false,
        message: 'Meta financeira não encontrada',
      };
    }

    return {
      success: true,
      data: goal.toPlainObject(),
    };
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Atualizar progresso da meta' })
  async updateProgress(@Param('id') goalId: string, @Body('amount') amount: number) {
    const goal = await this.updateGoalProgressUseCase.execute({
      goalId,
      amount,
    });

    return {
      success: true,
      message: goal.isCompleted()
        ? 'Meta financeira concluída!'
        : 'Progresso atualizado com sucesso',
      data: goal.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar meta financeira' })
  async delete(@Param('id') id: string) {
    await this.financialGoalRepository.delete(id);
  }
}
