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

import { WorkspaceFinancesService } from './workspace-finances.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddMemberDto,
  GetWorkspacesDto,
  CreateTransactionDto,
  GetTransactionsDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { User } from '../../common/decorators/user.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CacheEventsService } from '../../cache-events/cache-events.service';
import { UserRole } from '@prisma/client';

@ApiTags('Workspace Finanças')
@Controller({ path: 'finances/workspaces', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class WorkspaceFinancesController {
  private readonly logger = new Logger(WorkspaceFinancesController.name);

  constructor(
    private readonly workspaceFinancesService: WorkspaceFinancesService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar novo workspace' })
  @ApiResponse({ status: 201, description: 'Workspace criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Criando workspace para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.workspaceFinancesService.createWorkspace(
      clientId,
      userId,
      createWorkspaceDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'workspace_created' },
    });

    return result;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'workspaces:list',
    ttl: 300,
    tags: ['workspaces'],
  })
  @ApiOperation({ summary: 'Listar workspaces do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de workspaces' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome' })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    type: Boolean,
    description: 'Filtrar por público',
  })
  async getWorkspaces(
    @Query() filters: GetWorkspacesDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Listando workspaces para clientId: ${clientId}, userId: ${userId}`);
    return this.workspaceFinancesService.getUserWorkspaces(clientId, userId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'workspaces:detail',
    ttl: 600,
    tags: ['workspaces'],
  })
  @ApiOperation({ summary: 'Buscar workspace por ID' })
  @ApiResponse({ status: 200, description: 'Workspace encontrado' })
  @ApiResponse({ status: 404, description: 'Workspace não encontrado' })
  async getWorkspace(
    @Param('id') id: string,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Buscando workspace ${id} para clientId: ${clientId}, userId: ${userId}`);
    return this.workspaceFinancesService.getWorkspace(id, userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar workspace' })
  @ApiResponse({ status: 200, description: 'Workspace atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Workspace não encontrado' })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Atualizando workspace ${id} para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.workspaceFinancesService.updateWorkspace(
      id,
      userId,
      updateWorkspaceDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'workspace_updated' },
    });

    return result;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Deletar workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Workspace não encontrado' })
  async deleteWorkspace(
    @Param('id') id: string,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Deletando workspace ${id} para clientId: ${clientId}, userId: ${userId}`);

    const result = await this.workspaceFinancesService.deleteWorkspace(id, userId);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'workspace_deleted' },
    });

    return result;
  }

  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Adicionar membro ao workspace' })
  @ApiResponse({ status: 201, description: 'Membro adicionado com sucesso' })
  @ApiResponse({ status: 404, description: 'Workspace não encontrado' })
  async addMember(
    @Param('id') workspaceId: string,
    @Body() addMemberDto: AddMemberDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Adicionando membro ao workspace ${workspaceId}`);

    const result = await this.workspaceFinancesService.addMember(
      workspaceId,
      userId,
      addMemberDto.userId,
      addMemberDto.role,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'member_added' },
    });

    return result;
  }

  @Delete(':id/members/:memberId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Remover membro do workspace' })
  @ApiResponse({ status: 200, description: 'Membro removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Removendo membro ${memberId} do workspace ${workspaceId}`);

    const result = await this.workspaceFinancesService.removeMember(workspaceId, memberId, userId);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'member_removed' },
    });

    return result;
  }

  @Get(':id/transactions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'workspace:transactions',
    ttl: 300,
    tags: ['workspaces', 'transactions'],
  })
  @ApiOperation({ summary: 'Listar transações do workspace' })
  @ApiResponse({ status: 200, description: 'Lista de transações do workspace' })
  async getWorkspaceTransactions(
    @Param('id') workspaceId: string,
    @Query() filters: GetTransactionsDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Listando transações do workspace ${workspaceId}`);
    return this.workspaceFinancesService.getWorkspaceTransactions(workspaceId, userId, filters);
  }

  @Post(':id/transactions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar transação no workspace' })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createWorkspaceTransaction(
    @Param('id') workspaceId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @Tenant() clientId: string,
    @User('id') userId: string,
  ) {
    this.logger.log(`Criando transação no workspace ${workspaceId}`);

    const result = await this.workspaceFinancesService.createSharedTransaction(
      clientId,
      workspaceId,
      userId,
      createTransactionDto,
    );

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'workspaces',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'transaction_created' },
    });

    return result;
  }

  @Get(':id/summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'workspace:summary',
    ttl: 300,
    tags: ['workspaces'],
  })
  @ApiOperation({ summary: 'Obter resumo financeiro do workspace' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro do workspace' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data inicial' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data final' })
  async getWorkspaceSummary(
    @Param('id') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Tenant() clientId?: string,
    @User('id') userId?: string,
  ) {
    this.logger.log(`Gerando resumo do workspace ${workspaceId}`);
    return this.workspaceFinancesService.getWorkspaceSummary(
      workspaceId,
      userId,
      startDate,
      endDate,
    );
  }
}
