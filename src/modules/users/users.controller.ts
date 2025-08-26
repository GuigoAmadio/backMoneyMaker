import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';
import { CacheEventsService } from '../../cache-events/cache-events.service';

@ApiTags('Usuários')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  @Get()
  @Cacheable({
    key: 'users:list',
    ttl: 300, // 5 minutos
    tags: ['users', 'list'],
  })
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    this.logger.log(`Listando usuários para clientId: ${clientId}`);
    return await this.usersService.findAll(clientId, query);
  }

  @Get(':id')
  @Cacheable({
    key: 'users:detail',
    ttl: 600, // 10 minutos
    tags: ['users', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando usuário ${id} para clientId: ${clientId}`);
    return await this.usersService.findOne(id, clientId);
  }

  @Post()
  @CacheInvalidate('users:list')
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createUserDto: any, @Tenant() clientId: string) {
    this.logger.log(`Criando usuário para clientId: ${clientId}`);
    const user = await this.usersService.create(createUserDto, clientId);

    // ✅ Invalidar cache específico do usuário criado
    if (user?.id) {
      await this.cacheService.delete(`users:detail:${user.id}`);
    }

    // ✅ Emitir evento SSE para invalidação em tempo real
    console.log(`📡 [Users] Emitindo evento SSE após criação - userId: ${user?.id}`);
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: user?.id ? `clients:${user.id}` : 'clients',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'client_created' },
    });
    console.log(`✅ [Users] Cache e SSE processados com sucesso após criação`);

    return user;
  }

  @Patch(':id')
  @CacheInvalidate('users:list')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(@Param('id') id: string, @Body() updateUserDto: any, @Tenant() clientId: string) {
    this.logger.log(`Atualizando usuário ${id} para clientId: ${clientId}`);
    const user = await this.usersService.update(id, updateUserDto, clientId);

    // ✅ Invalidar cache específico do usuário atualizado
    await this.cacheService.delete(`users:detail:${id}`);

    // ✅ Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: `clients:${id}`,
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'client_updated' },
    });

    return user;
  }

  @Delete(':id')
  @CacheInvalidate('users:list')
  @ApiOperation({ summary: 'Deletar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando usuário ${id} para clientId: ${clientId}`);
    await this.usersService.remove(id, clientId);

    // ✅ Invalidar cache específico do usuário removido
    await this.cacheService.delete(`users:detail:${id}`);

    // ✅ Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: `clients:${id}`,
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'client_deleted' },
    });

    return { success: true, message: 'Usuário removido com sucesso' };
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de usuários' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['users']);
    return { success: true, message: 'Cache de usuários limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de usuários' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
