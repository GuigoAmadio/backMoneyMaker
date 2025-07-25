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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';

@ApiTags('Clientes (Empresas)')
@Controller({ path: 'clients', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ClientsController {
  private readonly logger = new Logger(ClientsController.name);

  constructor(
    private readonly clientsService: ClientsService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Slug ou email já em uso' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @Cacheable({
    key: 'clients:list',
    ttl: 600, // 10 minutos
    tags: ['clients', 'list'],
  })
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(@Query() paginationDto: PaginationDto) {
    this.logger.log(`Listando todos os clientes`);
    return this.clientsService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Cacheable({
    key: 'clients:detail',
    ttl: 900, // 15 minutos
    tags: ['clients', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  findOne(@Param('id') id: string) {
    this.logger.log(`Buscando cliente por ID: ${id}`);
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Slug ou email já em uso' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar status do cliente' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.clientsService.updateStatus(id, status);
  }

  @Get('by-employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Cacheable({
    key: 'clients:by-employee',
    ttl: 300, // 5 minutos
    tags: ['clients', 'by-employee'],
  })
  @ApiOperation({ summary: 'Listar usuários (clientes) atendidos por um funcionário' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  findClientsByEmployee(@Param('employeeId') employeeId: string) {
    this.logger.log(`Buscando clientes por funcionário: ${employeeId}`);
    return this.clientsService.findClientsByEmployee(employeeId);
  }

  @Get('cache/clear')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Limpar cache de clientes' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['clients']);
    return { success: true, message: 'Cache de clientes limpo com sucesso' };
  }

  @Get('cache/stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas do cache de clientes' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
