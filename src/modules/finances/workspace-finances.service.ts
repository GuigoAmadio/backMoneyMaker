import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateTransactionDto,
  GetTransactionsDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  GetWorkspacesDto,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WorkspaceFinancesService {
  private readonly logger = new Logger(WorkspaceFinancesService.name);

  constructor(private prisma: PrismaService) {}

  // Criar workspace compartilhado
  async createWorkspace(clientId: string, userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    this.logger.log(`Criando workspace para clientId: ${clientId}, userId: ${userId}`);

    const workspace = await this.prisma.workspace.create({
      data: {
        clientId,
        name: createWorkspaceDto.name,

        description: createWorkspaceDto.description,
        isPublic: createWorkspaceDto.isPublic || false,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Workspace criado: ${workspace.id} para clientId: ${clientId}`);

    return {
      success: true,
      message: 'Workspace criado com sucesso',
      data: workspace,
    };
  }

  // Adicionar membro ao workspace
  async addMember(
    workspaceId: string,
    userId: string,
    newMemberId: string,
    role: string = 'MEMBER',
  ) {
    this.logger.log(`Adicionando membro ${newMemberId} ao workspace ${workspaceId}`);

    // Verificar se o usuário tem permissão para adicionar membros
    await this.checkWorkspacePermission(workspaceId, userId, 'MANAGE_MEMBERS');

    const membership = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: newMemberId,
        role: role as any,
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

    this.logger.log(`Membro adicionado ao workspace: ${workspaceId}`);

    return {
      success: true,
      message: 'Membro adicionado com sucesso',
      data: membership,
    };
  }

  // Criar transação em workspace compartilhado
  async createSharedTransaction(
    clientId: string,
    workspaceId: string,
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    this.logger.log(`Criando transação compartilhada no workspace ${workspaceId}`);

    // Verificar se usuário tem permissão no workspace
    await this.checkWorkspacePermission(workspaceId, userId, 'CREATE_TRANSACTION');

    // Verificar se a categoria existe ou criar
    let categoryId = null;
    if (createTransactionDto.category) {
      const category = await this.prisma.category.findFirst({
        where: {
          name: createTransactionDto.category,
          type: 'financial',
        },
      });

      if (!category) {
        const newCategory = await this.prisma.category.create({
          data: {
            clientId: clientId,
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
        clientId: clientId,
        title: createTransactionDto.title,
        description: createTransactionDto.description,
        amount: createTransactionDto.amount,
        type: createTransactionDto.type,
        status: createTransactionDto.status || 'CONFIRMED',
        date: new Date(createTransactionDto.date),
        isRecurring: createTransactionDto.isRecurring || false,
        tags: createTransactionDto.tags || [],
        recurringPattern: createTransactionDto.recurringPattern,
        workspaceId,
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
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Transação compartilhada criada: ${transaction.id}`);

    return {
      success: true,
      message: 'Transação compartilhada criada com sucesso',
      data: transaction,
    };
  }

  // Listar transações do workspace
  async getWorkspaceTransactions(workspaceId: string, userId: string, filters: GetTransactionsDto) {
    this.logger.log(`Listando transações do workspace ${workspaceId}`);

    // Verificar permissão
    await this.checkWorkspacePermission(workspaceId, userId, 'VIEW');

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
      workspaceId,
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
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Encontradas ${transactions.length} transações no workspace ${workspaceId}`);

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
      message: 'Transações do workspace listadas com sucesso',
    };
  }

  // Resumo financeiro do workspace
  async getWorkspaceSummary(
    workspaceId: string,
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    this.logger.log(`Gerando resumo do workspace ${workspaceId}`);

    // Verificar permissão
    await this.checkWorkspacePermission(workspaceId, userId, 'VIEW');

    const where: any = {
      workspaceId,
      status: 'CONFIRMED',
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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

    // Resumo por usuário
    const userSummary = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Resumo por categoria
    const categorySummary = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    this.logger.log(`Resumo do workspace gerado: ${workspaceId}`);

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
        userSummary,
        categorySummary,
      },
      message: 'Resumo do workspace gerado com sucesso',
    };
  }

  // Verificar permissão do usuário no workspace
  private async checkWorkspacePermission(workspaceId: string, userId: string, permission: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
      include: {
        permissions: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Usuário não é membro deste workspace');
    }

    // Verificar se tem a permissão específica
    const hasPermission = membership.permissions.some(
      (p) => p.permission === permission || p.permission === 'ALL',
    );

    if (!hasPermission && membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException(`Usuário não tem permissão: ${permission}`);
    }

    return membership;
  }

  // Listar workspaces do usuário
  async getUserWorkspaces(clientId: string, userId: string) {
    this.logger.log(`Listando workspaces do usuário ${userId}`);

    const workspaces = await this.prisma.workspace.findMany({
      where: {
        clientId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            members: true,
          },
        },
      },
    });

    this.logger.log(`Encontrados ${workspaces.length} workspaces para o usuário ${userId}`);

    return {
      success: true,
      data: workspaces,
      message: 'Workspaces listados com sucesso',
    };
  }

  // Buscar workspace específico
  async getWorkspace(workspaceId: string, userId: string) {
    this.logger.log(`Buscando workspace ${workspaceId} para userId: ${userId}`);

    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            members: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }

    this.logger.log(`Workspace encontrado: ${workspaceId}`);

    return {
      success: true,
      data: workspace,
    };
  }

  // Atualizar workspace
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    this.logger.log(`Atualizando workspace ${workspaceId} para userId: ${userId}`);

    // Verificar se usuário tem permissão para atualizar
    await this.checkWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const updatedWorkspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateWorkspaceDto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Workspace atualizado: ${workspaceId}`);

    return {
      success: true,
      message: 'Workspace atualizado com sucesso',
      data: updatedWorkspace,
    };
  }

  // Deletar workspace
  async deleteWorkspace(workspaceId: string, userId: string) {
    this.logger.log(`Deletando workspace ${workspaceId} para userId: ${userId}`);

    // Verificar se usuário é OWNER
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: 'OWNER',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Apenas o proprietário pode deletar o workspace');
    }

    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    this.logger.log(`Workspace deletado: ${workspaceId}`);

    return {
      success: true,
      message: 'Workspace deletado com sucesso',
    };
  }

  // Remover membro do workspace
  async removeMember(workspaceId: string, memberId: string, userId: string) {
    this.logger.log(`Removendo membro ${memberId} do workspace ${workspaceId}`);

    // Verificar se usuário tem permissão para gerenciar membros
    await this.checkWorkspacePermission(workspaceId, userId, 'MANAGE_MEMBERS');

    // Verificar se o membro existe
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
    });

    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    // Não permitir remover o OWNER
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Não é possível remover o proprietário do workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    this.logger.log(`Membro removido do workspace: ${workspaceId}`);

    return {
      success: true,
      message: 'Membro removido com sucesso',
    };
  }

  // Atualizar permissões de membro
  async updateMemberPermissions(
    workspaceId: string,
    memberId: string,
    userId: string,
    permissions: string[],
  ) {
    this.logger.log(`Atualizando permissões do membro ${memberId} no workspace ${workspaceId}`);

    // Verificar se usuário tem permissão para gerenciar membros
    await this.checkWorkspacePermission(workspaceId, userId, 'MANAGE_MEMBERS');

    // Atualizar permissões
    await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        permissions: {
          deleteMany: {},
          create: permissions.map((permission) => ({
            permission: permission as any,
            workspaceId: workspaceId,
            grantedBy: userId,
          })),
        },
      },
    });

    this.logger.log(`Permissões atualizadas para membro ${memberId}`);

    return {
      success: true,
      message: 'Permissões atualizadas com sucesso',
    };
  }

  // Listar membros do workspace
  async getWorkspaceMembers(workspaceId: string, userId: string) {
    this.logger.log(`Listando membros do workspace ${workspaceId}`);

    // Verificar se usuário é membro do workspace
    await this.checkWorkspacePermission(workspaceId, userId, 'VIEW');

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    this.logger.log(`Encontrados ${members.length} membros no workspace ${workspaceId}`);

    return {
      success: true,
      data: members,
      message: 'Membros listados com sucesso',
    };
  }

  // Transferir propriedade do workspace
  async transferOwnership(workspaceId: string, currentOwnerId: string, newOwnerId: string) {
    this.logger.log(`Transferindo propriedade do workspace ${workspaceId} para ${newOwnerId}`);

    // Verificar se usuário atual é OWNER
    const currentOwner = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: currentOwnerId,
        role: 'OWNER',
      },
    });

    if (!currentOwner) {
      throw new ForbiddenException('Apenas o proprietário pode transferir a propriedade');
    }

    // Verificar se novo proprietário é membro
    const newOwner = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: newOwnerId,
      },
    });

    if (!newOwner) {
      throw new NotFoundException('Novo proprietário deve ser membro do workspace');
    }

    // Atualizar roles
    await this.prisma.$transaction([
      // Remover role de OWNER do atual
      this.prisma.workspaceMember.update({
        where: { id: currentOwner.id },
        data: { role: 'ADMIN' },
      }),
      // Dar role de OWNER ao novo
      this.prisma.workspaceMember.update({
        where: { id: newOwner.id },
        data: { role: 'OWNER' },
      }),
    ]);

    this.logger.log(`Propriedade transferida para ${newOwnerId}`);

    return {
      success: true,
      message: 'Propriedade transferida com sucesso',
    };
  }
}
