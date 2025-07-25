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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';

import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';

@ApiTags('Serviços')
@Controller({ path: 'services', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(
    private readonly servicesService: ServicesService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar novo serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Nome do serviço já está em uso' })
  create(@Body() createServiceDto: CreateServiceDto, @Tenant() clientId: string) {
    this.logger.log(`Criando serviço para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(createServiceDto)}`);

    const result = this.servicesService.create(clientId, createServiceDto);

    this.logger.log(`Serviço criado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'services:list',
    ttl: 600, // 10 minutos
    tags: ['services', 'list'],
  })
  @ApiOperation({ summary: 'Listar serviços' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou descrição' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
    description: 'Filtrar por status',
  })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Tenant() clientId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(
      `Listando serviços para clientId: ${clientId}, search: ${search}, status: ${status}`,
    );

    const result = this.servicesService.findAll(clientId, paginationDto, search, status);

    this.logger.log(`Serviços retornados com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @Cacheable({
    key: 'services:detail',
    ttl: 600, // 10 minutos
    tags: ['services', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando serviço ${id} para clientId: ${clientId}`);

    const result = this.servicesService.findOne(clientId, id);

    this.logger.log(`Serviço retornado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome do serviço já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando serviço ${id} para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(updateServiceDto)}`);

    const result = this.servicesService.update(clientId, id, updateServiceDto);

    this.logger.log(`Serviço atualizado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deletar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando serviço ${id} para clientId: ${clientId}`);

    const result = this.servicesService.remove(clientId, id);

    this.logger.log(`Serviço deletado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @CacheInvalidate('services:list')
  @ApiOperation({ summary: 'Atualizar status do serviço' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Tenant() clientId: string,
  ) {
    this.logger.log(
      `Atualizando status do serviço ${id} para ${isActive} em clientId: ${clientId}`,
    );

    const result = this.servicesService.updateStatus(clientId, id, isActive);

    this.logger.log(`Status do serviço atualizado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('cache/clear')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Limpar cache de serviços' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['services']);
    return { success: true, message: 'Cache de serviços limpo com sucesso' };
  }

  @Get('cache/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas do cache de serviços' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
