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
  ) {}

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
    this.logger.log(`Listando funcionários para clientId: ${clientId}`);
    return await this.employeesService.findAll(clientId, query);
  }

  @Get(':id')
  @Cacheable({
    key: 'employees:detail',
    ttl: 600, // 10 minutos
    tags: ['employees', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando funcionário ${id} para clientId: ${clientId}`);
    return await this.employeesService.findOne(id, clientId);
  }

  @Post()
  @CacheInvalidate('employees:list')
  @ApiOperation({ summary: 'Criar novo funcionário' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createEmployeeDto: any, @Tenant() clientId: string) {
    this.logger.log(`Criando funcionário para clientId: ${clientId}`);
    const employee = await this.employeesService.create(createEmployeeDto, clientId);

    // Invalidar cache específico do funcionário criado
    if (employee.data?.id) {
      await this.cacheService.delete(`employees:detail:${employee.data.id}`);
    }

    return employee;
  }

  @Patch(':id')
  @CacheInvalidate('employees:list')
  @ApiOperation({ summary: 'Atualizar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: any,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando funcionário ${id} para clientId: ${clientId}`);
    const employee = await this.employeesService.update(id, updateEmployeeDto, clientId);

    // Invalidar cache específico do funcionário atualizado
    await this.cacheService.delete(`employees:detail:${id}`);

    return employee;
  }

  @Delete(':id')
  @CacheInvalidate('employees:list')
  @ApiOperation({ summary: 'Deletar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando funcionário ${id} para clientId: ${clientId}`);
    await this.employeesService.remove(id, clientId);

    // Invalidar cache específico do funcionário removido
    await this.cacheService.delete(`employees:detail:${id}`);

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
