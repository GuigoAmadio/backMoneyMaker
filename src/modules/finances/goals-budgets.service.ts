import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFinancialGoalDto, CreateBudgetDto, CreateBudgetCategoryDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class GoalsBudgetsService {
  private readonly logger = new Logger(GoalsBudgetsService.name);

  constructor(private prisma: PrismaService) {}

  // ===== METAS FINANCEIRAS =====

  // Criar meta financeira
  async createFinancialGoal(
    clientId: string,
    userId: string,
    createFinancialGoalDto: CreateFinancialGoalDto,
  ) {
    this.logger.log(`Criando meta financeira para clientId: ${clientId}, userId: ${userId}`);

    const goal = await this.prisma.financialGoal.create({
      data: {
        ...createFinancialGoalDto,
        clientId,
        userId,
        targetDate: new Date(createFinancialGoalDto.targetDate),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Meta financeira criada: ${goal.id}`);

    return {
      success: true,
      message: 'Meta financeira criada com sucesso',
      data: goal,
    };
  }

  // Listar metas financeiras
  async getFinancialGoals(clientId: string, userId: string, filters?: any) {
    this.logger.log(`Listando metas financeiras para clientId: ${clientId}, userId: ${userId}`);

    const where: any = {
      clientId,
      userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const goals = await this.prisma.financialGoal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Encontradas ${goals.length} metas financeiras`);

    return {
      success: true,
      data: goals,
      message: 'Metas financeiras listadas com sucesso',
    };
  }

  // Atualizar progresso da meta
  async updateGoalProgress(goalId: string, userId: string, amount: number) {
    this.logger.log(`Atualizando progresso da meta ${goalId} com valor ${amount}`);

    const goal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Meta financeira não encontrada');
    }

    const newAmount = goal.currentAmount.add(amount);
    const isCompleted = newAmount >= goal.targetAmount;

    const updatedGoal = await this.prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        status: isCompleted ? 'COMPLETED' : goal.status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Progresso da meta atualizado: ${goalId}`);

    return {
      success: true,
      message: isCompleted ? 'Meta financeira concluída!' : 'Progresso atualizado com sucesso',
      data: updatedGoal,
    };
  }

  // ===== ORÇAMENTOS =====

  // Criar orçamento
  async createBudget(clientId: string, userId: string, createBudgetDto: CreateBudgetDto) {
    this.logger.log(`Criando orçamento para clientId: ${clientId}, userId: ${userId}`);

    const budget = await this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        clientId,
        userId,
        startDate: new Date(createBudgetDto.startDate),
        endDate: new Date(createBudgetDto.endDate),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    this.logger.log(`Orçamento criado: ${budget.id}`);

    return {
      success: true,
      message: 'Orçamento criado com sucesso',
      data: budget,
    };
  }

  // Listar orçamentos
  async getBudgets(clientId: string, userId: string, filters?: any) {
    this.logger.log(`Listando orçamentos para clientId: ${clientId}, userId: ${userId}`);

    const where: any = {
      clientId,
      userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.period) {
      where.period = filters.period;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Encontrados ${budgets.length} orçamentos`);

    return {
      success: true,
      data: budgets,
      message: 'Orçamentos listados com sucesso',
    };
  }

  // Adicionar categoria ao orçamento
  async addBudgetCategory(
    budgetId: string,
    userId: string,
    createBudgetCategoryDto: CreateBudgetCategoryDto,
  ) {
    this.logger.log(`Adicionando categoria ao orçamento ${budgetId}`);

    // Verificar se o orçamento existe e pertence ao usuário
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Verificar se a categoria já existe no orçamento
    const existingCategory = await this.prisma.budgetCategory.findFirst({
      where: {
        budgetId,
        categoryId: createBudgetCategoryDto.categoryId,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Categoria já existe neste orçamento');
    }

    const budgetCategory = await this.prisma.budgetCategory.create({
      data: {
        ...createBudgetCategoryDto,
        budgetId,
      },
      include: {
        category: true,
      },
    });

    this.logger.log(`Categoria adicionada ao orçamento: ${budgetCategory.id}`);

    return {
      success: true,
      message: 'Categoria adicionada ao orçamento com sucesso',
      data: budgetCategory,
    };
  }

  // Atualizar gastos da categoria
  async updateCategorySpending(budgetCategoryId: string, userId: string, amount: number) {
    this.logger.log(`Atualizando gastos da categoria ${budgetCategoryId} com valor ${amount}`);

    const budgetCategory = await this.prisma.budgetCategory.findFirst({
      where: {
        id: budgetCategoryId,
        budget: {
          userId,
        },
      },
    });

    if (!budgetCategory) {
      throw new NotFoundException('Categoria do orçamento não encontrada');
    }

    const newSpent = budgetCategory.spentAmount.add(amount);

    if (newSpent.gt(budgetCategory.amount)) {
      this.logger.warn(`Categoria ${budgetCategoryId} ultrapassou o orçamento!`);
    }

    const updatedCategory = await this.prisma.budgetCategory.update({
      where: { id: budgetCategoryId },
      data: { spentAmount: newSpent },
      include: {
        category: true,
      },
    });

    this.logger.log(`Gastos da categoria atualizados: ${budgetCategoryId}`);

    return {
      success: true,
      message:
        newSpent > budgetCategory.amount
          ? 'Categoria ultrapassou o orçamento!'
          : 'Gastos atualizados com sucesso',
      data: updatedCategory,
    };
  }

  // Resumo do orçamento
  async getBudgetSummary(budgetId: string, userId: string) {
    this.logger.log(`Gerando resumo do orçamento ${budgetId}`);

    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const totalAllocated = budget.categories.reduce(
      (sum, cat) => sum.add(cat.amount),
      new Decimal(0),
    );
    const totalSpent = budget.categories.reduce(
      (sum, cat) => sum.add(cat.spentAmount),
      new Decimal(0),
    );
    const remaining = totalAllocated.sub(totalSpent);
    const percentageUsed = totalAllocated.gt(0)
      ? totalSpent.div(totalAllocated).mul(100).toNumber()
      : 0;

    const categoryBreakdown = budget.categories.map((cat) => ({
      category: cat.category,
      allocated: cat.amount,
      spent: cat.spentAmount,
      remaining: cat.amount.sub(cat.spentAmount),
      percentageUsed: cat.amount.gt(0) ? cat.spentAmount.div(cat.amount).mul(100).toNumber() : 0,
      isOverBudget: cat.spentAmount.gt(cat.amount),
    }));

    this.logger.log(`Resumo do orçamento gerado: ${budgetId}`);

    return {
      success: true,
      data: {
        budget: {
          id: budget.id,
          name: budget.name,
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate,
          status: budget.status,
        },
        summary: {
          totalAllocated,
          totalSpent,
          remaining,
          percentageUsed,
        },
        categoryBreakdown,
      },
      message: 'Resumo do orçamento gerado com sucesso',
    };
  }

  // Resumo geral de metas e orçamentos
  async getFinancialOverview(clientId: string, userId: string) {
    this.logger.log(`Gerando visão geral financeira para clientId: ${clientId}, userId: ${userId}`);

    const [goals, budgets] = await Promise.all([
      this.prisma.financialGoal.findMany({
        where: { clientId, userId },
        select: {
          id: true,
          title: true,
          targetAmount: true,
          currentAmount: true,
          status: true,
          targetDate: true,
        },
      }),
      this.prisma.budget.findMany({
        where: { clientId, userId },
        include: {
          categories: true,
        },
      }),
    ]);

    // Calcular estatísticas das metas
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED');
    const totalGoalTarget = activeGoals.reduce((sum, g) => sum.add(g.targetAmount), new Decimal(0));
    const totalGoalCurrent = activeGoals.reduce(
      (sum, g) => sum.add(g.currentAmount),
      new Decimal(0),
    );

    // Calcular estatísticas dos orçamentos
    const activeBudgets = budgets.filter((b) => b.status === 'ACTIVE');
    const totalBudgetAllocated = activeBudgets.reduce(
      (sum, b) =>
        sum.add(b.categories.reduce((catSum, cat) => catSum.add(cat.amount), new Decimal(0))),
      new Decimal(0),
    );
    const totalBudgetSpent = activeBudgets.reduce(
      (sum, b) =>
        sum.add(b.categories.reduce((catSum, cat) => catSum.add(cat.spentAmount), new Decimal(0))),
      new Decimal(0),
    );

    this.logger.log(`Visão geral financeira gerada para clientId: ${clientId}`);

    return {
      success: true,
      data: {
        goals: {
          total: goals.length,
          active: activeGoals.length,
          completed: completedGoals.length,
          totalTarget: totalGoalTarget,
          totalCurrent: totalGoalCurrent,
          progressPercentage: totalGoalTarget.gt(0)
            ? totalGoalCurrent.div(totalGoalTarget).mul(100).toNumber()
            : 0,
        },
        budgets: {
          total: budgets.length,
          active: activeBudgets.length,
          totalAllocated: totalBudgetAllocated,
          totalSpent: totalBudgetSpent,
          remaining: totalBudgetAllocated.sub(totalBudgetSpent),
          usagePercentage: totalBudgetAllocated.gt(0)
            ? totalBudgetSpent.div(totalBudgetAllocated).mul(100).toNumber()
            : 0,
        },
        recentGoals: goals.slice(0, 5),
        recentBudgets: budgets.slice(0, 5),
      },
      message: 'Visão geral financeira gerada com sucesso',
    };
  }
}
