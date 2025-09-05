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
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';
import { CacheEventsService } from '../../cache-events/cache-events.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Funcionários')
@Controller({ path: 'employees', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly cacheService: CacheService,
    private readonly cacheEventsService: CacheEventsService,
  ) {}

  @Get('count')
  @Cacheable({
    key: 'employees:count',
    ttl: 300, // 5 minutos
    tags: ['employees', 'count'],
  })
  @ApiOperation({ summary: 'Obter quantidade de funcionários' })
  @ApiResponse({ status: 200, description: 'Quantidade de funcionários' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filtrar por status ativo (true/false)',
  })
  async getEmployeesCount(@Tenant() clientId: string, @Query('isActive') isActive?: string) {
    this.logger.log(
      `Obtendo quantidade de funcionários para clientId: ${clientId}, isActive: ${isActive}`,
    );

    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    const result = await this.employeesService.getEmployeesCount(clientId, isActiveBoolean);

    this.logger.log(`Quantidade de funcionários retornada com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('count/active')
  @Cacheable({
    key: 'employees:count:active',
    ttl: 300, // 5 minutos
    tags: ['employees', 'count', 'active'],
  })
  @ApiOperation({ summary: 'Obter quantidade de funcionários ativos' })
  @ApiResponse({ status: 200, description: 'Quantidade de funcionários ativos' })
  async getActiveEmployeesCount(@Tenant() clientId: string) {
    this.logger.log(`Obtendo quantidade de funcionários ativos para clientId: ${clientId}`);

    const result = await this.employeesService.getActiveEmployeesCount(clientId);

    this.logger.log(
      `Quantidade de funcionários ativos retornada com sucesso para clientId: ${clientId}`,
    );
    return result;
  }

  @Get('count/inactive')
  @Cacheable({
    key: 'employees:count:inactive',
    ttl: 300, // 5 minutos
    tags: ['employees', 'count', 'inactive'],
  })
  @ApiOperation({ summary: 'Obter quantidade de funcionários inativos' })
  @ApiResponse({ status: 200, description: 'Quantidade de funcionários inativos' })
  async getInactiveEmployeesCount(@Tenant() clientId: string) {
    this.logger.log(`Obtendo quantidade de funcionários inativos para clientId: ${clientId}`);

    const result = await this.employeesService.getInactiveEmployeesCount(clientId);

    this.logger.log(
      `Quantidade de funcionários inativos retornada com sucesso para clientId: ${clientId}`,
    );
    return result;
  }

  @Get('stats')
  @Cacheable({
    key: 'employees:stats',
    ttl: 600, // 10 minutos
    tags: ['employees', 'stats'],
  })
  @ApiOperation({ summary: 'Obter estatísticas de funcionários' })
  @ApiResponse({ status: 200, description: 'Estatísticas de funcionários' })
  async getEmployeeStats(@Tenant() clientId: string) {
    this.logger.log(`Obtendo estatísticas de funcionários para clientId: ${clientId}`);
    return await this.employeesService.getEmployeeStats(clientId);
  }

  @Get('available')
  @Public()
  @Cacheable({
    key: 'employees:available',
    ttl: 300, // 5 minutos
    tags: ['employees', 'available'],
  })
  @ApiOperation({ summary: 'Listar funcionários disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários disponíveis' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Data para verificar disponibilidade (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'serviceId',
    required: false,
    description: 'ID do serviço para filtrar especialistas',
  })
  async getAvailableEmployees(
    @Tenant() clientId: string,
    @Query('date') date?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    this.logger.log(
      `Obtendo funcionários disponíveis para clientId: ${clientId}, date: ${date}, serviceId: ${serviceId}`,
    );

    const result = await this.employeesService.getAvailableEmployees(clientId, date, serviceId);

    this.logger.log(`Funcionários disponíveis retornados com sucesso para clientId: ${clientId}`);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @Public()
  @Cacheable({
    key: 'employees:list',
    ttl: 300, // 5 minutos
    tags: ['employees', 'list'],
  })
  @ApiOperation({ summary: 'Listar funcionários' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    this.logger.log(`=== INÍCIO: Listando funcionários para clientId: ${clientId} ===`);
    this.logger.log(`Query params: ${JSON.stringify(query)}`);
    this.logger.log(`Cache configurado: key=employees:list, ttl=300`);

    try {
      const result = await this.employeesService.findAll(clientId, query);
      this.logger.log(`=== SUCESSO: Listagem concluída para clientId: ${clientId} ===`);
      this.logger.log(`Resultado: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`=== ERRO: Listagem falhou para clientId: ${clientId} ===`, error);
      throw error;
    }
  }

  @Get(':id')
  @Public()
  @Cacheable({
    key: 'employees:detail:${id}',
    ttl: 600, // 10 minutos
    tags: ['employees', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`=== INÍCIO: Buscando funcionário ${id} para clientId: ${clientId} ===`);

    try {
      const result = await this.employeesService.findOne(id, clientId);
      this.logger.log(`=== SUCESSO: Busca concluída para funcionário ${id} ===`);
      this.logger.log(`Resultado: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`=== ERRO: Busca falhou para funcionário ${id} ===`, error);
      throw error;
    }
  }

  @Post()
  @CacheInvalidate('employees:list')
  @ApiOperation({ summary: 'Criar novo funcionário' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Tenant() clientId: string) {
    this.logger.log(`Criando funcionário para clientId: ${clientId}`);
    const employee = await this.employeesService.create(createEmployeeDto, clientId);

    // ✅ Invalidar cache específico do funcionário criado
    if (employee.data?.id) {
      await this.cacheService.delete(`employees:detail:${employee.data.id}`);
    }

    // ✅ Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: employee.data?.id ? `employees:${employee.data.id}` : 'employees',
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'employee_created' }
    });

    return employee;
  }

  @Patch(':id')
  @CacheInvalidate('employees:detail')
  @ApiOperation({ summary: 'Atualizar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando funcionário ${id} para clientId: ${clientId}`);
    const employee = await this.employeesService.update(id, updateEmployeeDto, clientId);

    // ✅ Invalidar cache específico do funcionário atualizado
    await this.cacheService.delete(`employees:detail:${id}`);

    // ✅ Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: `employees:${id}`,
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'employee_updated' }
    });

    return employee;
  }

  @Delete(':id')
  @CacheInvalidate('employees:detail')
  @ApiOperation({ summary: 'Deletar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando funcionário ${id} para clientId: ${clientId}`);
    await this.employeesService.remove(id, clientId);

    // ✅ Invalidar cache específico do funcionário removido
    await this.cacheService.delete(`employees:detail:${id}`);

    // ✅ Emitir evento SSE para invalidação em tempo real
    this.cacheEventsService.emitCacheEvent({
      type: 'invalidate',
      pattern: `employees:${id}`,
      timestamp: new Date().toISOString(),
      clientId,
      metadata: { reason: 'employee_deleted' }
    });

    return { success: true, message: 'Funcionário removido com sucesso' };
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de funcionários' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['employees']);
    return { success: true, message: 'Cache de funcionários limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de funcionários' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
