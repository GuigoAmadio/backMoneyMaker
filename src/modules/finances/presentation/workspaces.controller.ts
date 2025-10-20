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
import { CreateWorkspaceUseCase } from '../application/use-cases/workspace/create-workspace.use-case';
import { IWorkspaceRepository } from '../domain/repositories/workspace.repository';
import { ITransactionRepository } from '../domain/repositories/transaction.repository';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  CreateTransactionDto,
  GetTransactionsDto,
} from '../dto';
import { CreateTransactionUseCase } from '../application/use-cases/transaction/create-transaction.use-case';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'finances/workspaces', version: '1' })
export class WorkspacesController {
  constructor(
    private readonly createWorkspaceUseCase: CreateWorkspaceUseCase,
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar workspace' })
  async create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    const workspace = await this.createWorkspaceUseCase.execute({
      ...dto,
      clientId: req.user.clientId,
      createdBy: req.user.userId,
    });

    return {
      success: true,
      message: 'Workspace criado com sucesso',
      data: workspace.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar workspaces do usuário' })
  async findAll(@Req() req: any) {
    const workspaces = await this.workspaceRepository.findByUser(
      req.user.clientId,
      req.user.userId,
    );

    return {
      success: true,
      data: workspaces.map((w) => w.toPlainObject()),
      message: 'Workspaces listados com sucesso',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar workspace por ID' })
  async findOne(@Param('id') id: string) {
    const workspace = await this.workspaceRepository.findById(id);

    if (!workspace) {
      return {
        success: false,
        message: 'Workspace não encontrado',
      };
    }

    return {
      success: true,
      data: workspace.toPlainObject(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar workspace' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    const workspace = await this.workspaceRepository.findById(id);

    if (!workspace) {
      return {
        success: false,
        message: 'Workspace não encontrado',
      };
    }

    if (dto.name) workspace.updateName(dto.name);
    if (dto.description !== undefined) workspace.updateDescription(dto.description);
    if (dto.isPublic !== undefined) {
      dto.isPublic ? workspace.makePublic() : workspace.makePrivate();
    }

    const updated = await this.workspaceRepository.update(workspace);

    return {
      success: true,
      message: 'Workspace atualizado com sucesso',
      data: updated.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar workspace' })
  async delete(@Param('id') id: string) {
    await this.workspaceRepository.delete(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Adicionar membro ao workspace' })
  async addMember(@Param('id') workspaceId: string, @Body() dto: AddMemberDto) {
    const member = await this.workspaceRepository.addMember(
      workspaceId,
      dto.userId,
      dto.role || 'MEMBER',
    );

    return {
      success: true,
      message: 'Membro adicionado com sucesso',
      data: member,
    };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros do workspace' })
  async getMembers(@Param('id') workspaceId: string) {
    const members = await this.workspaceRepository.getMembers(workspaceId);

    return {
      success: true,
      data: members,
      message: 'Membros listados com sucesso',
    };
  }

  @Delete(':workspaceId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover membro do workspace' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.workspaceRepository.removeMember(workspaceId, memberId);
  }

  @Post(':id/transactions')
  @ApiOperation({ summary: 'Criar transação no workspace' })
  async createTransaction(
    @Req() req: any,
    @Param('id') workspaceId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    const transaction = await this.createTransactionUseCase.execute({
      ...dto,
      date: new Date(dto.date),
      clientId: req.user.clientId,
      userId: req.user.userId,
      workspaceId,
    });

    return {
      success: true,
      message: 'Transação criada com sucesso',
      data: transaction.toPlainObject(),
    };
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Listar transações do workspace' })
  async getTransactions(@Param('id') workspaceId: string, @Query() filters: GetTransactionsDto) {
    const result = await this.transactionRepository.findByWorkspace(
      workspaceId,
      {
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
      {
        page: filters.page || 1,
        limit: filters.limit || 10,
      },
    );

    return {
      success: true,
      data: {
        transactions: result.data.map((t) => t.toPlainObject()),
        pagination: result.pagination,
      },
      message: 'Transações do workspace listadas com sucesso',
    };
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumo financeiro do workspace' })
  async getSummary(
    @Param('id') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const summary = await this.transactionRepository.getWorkspaceSummary(
      workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: summary,
      message: 'Resumo do workspace gerado com sucesso',
    };
  }
}
