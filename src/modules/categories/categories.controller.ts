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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CacheEventsService } from '../../cache-events/cache-events.service';
import { UserRole } from '@prisma/client';

@ApiTags('Categorias')
@Controller({ path: 'categories', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Nome da categoria já está em uso' })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Tenant() clientId: string) {
    this.logger.log(`Criando categoria para clientId: ${clientId}`);

    const result = await this.categoriesService.create(clientId, createCategoryDto);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'categories',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'category_created' },
    });

    return result;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'categories:list',
    ttl: 600,
    tags: ['categories'],
  })
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  findAll(@Tenant() clientId: string) {
    this.logger.log(`Listando categorias para clientId: ${clientId}`);
    return this.categoriesService.findAll(clientId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  @Cacheable({
    key: 'categories:detail',
    ttl: 600,
    tags: ['categories'],
  })
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando categoria ${id} para clientId: ${clientId}`);
    return this.categoriesService.findOne(clientId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome da categoria já está em uso' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando categoria ${id} para clientId: ${clientId}`);

    const result = await this.categoriesService.update(clientId, id, updateCategoryDto);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'categories',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'category_updated' },
    });

    return result;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deletar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando categoria ${id} para clientId: ${clientId}`);

    const result = await this.categoriesService.remove(clientId, id);

    // Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: 'categories',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'category_deleted' },
    });

    return result;
  }
}
