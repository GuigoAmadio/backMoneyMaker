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
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Tenant } from '../../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../../common/decorators/cache.decorator';
import { CacheService } from '../../../common/cache/cache.service';

@ApiTags('Ecommerce - Clientes')
@Controller({ path: 'ecommerce/customers', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @Cacheable({
    key: 'ecommerce:customers:list',
    ttl: 300, // 5 minutos
    tags: ['ecommerce', 'customers', 'list'],
  })
  @ApiOperation({ summary: 'Listar clientes do ecommerce' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    this.logger.log(`Listando clientes do ecommerce para clientId: ${clientId}`);
    return await this.customersService.findAll(clientId, query);
  }

  @Get(':id')
  @Cacheable({
    key: 'ecommerce:customers:detail',
    ttl: 600, // 10 minutos
    tags: ['ecommerce', 'customers', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando cliente ${id} para clientId: ${clientId}`);
    return await this.customersService.findOne(id, clientId);
  }

  @Post()
  @CacheInvalidate('ecommerce:customers:list')
  @ApiOperation({ summary: 'Criar novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createCustomerDto: any, @Tenant() clientId: string) {
    this.logger.log(`Criando cliente do ecommerce para clientId: ${clientId}`);
    const customer = await this.customersService.create(createCustomerDto, clientId);

    // Invalidar cache específico do cliente criado
    if (customer?.data?.id) {
      await this.cacheService.delete(`ecommerce:customers:detail:${customer.data.id}`);
    }

    return customer;
  }

  @Patch(':id')
  @CacheInvalidate('ecommerce:customers:list')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: any,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando cliente ${id} para clientId: ${clientId}`);
    const customer = await this.customersService.update(id, updateCustomerDto, clientId);

    // Invalidar cache específico do cliente atualizado
    await this.cacheService.delete(`ecommerce:customers:detail:${id}`);

    return customer;
  }

  @Delete(':id')
  @CacheInvalidate('ecommerce:customers:list')
  @ApiOperation({ summary: 'Deletar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando cliente ${id} para clientId: ${clientId}`);
    await this.customersService.remove(id, clientId);

    // Invalidar cache específico do cliente removido
    await this.cacheService.delete(`ecommerce:customers:detail:${id}`);

    return { success: true, message: 'Cliente removido com sucesso' };
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de clientes do ecommerce' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['ecommerce', 'customers']);
    return { success: true, message: 'Cache de clientes do ecommerce limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de clientes do ecommerce' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
