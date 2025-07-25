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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';

@ApiTags('Pedidos')
@Controller({ path: 'orders', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('stats')
  @Cacheable({
    key: 'orders:stats',
    ttl: 600, // 10 minutos
    tags: ['orders', 'stats'],
  })
  @ApiOperation({ summary: 'Obter estatísticas de pedidos' })
  @ApiResponse({ status: 200, description: 'Estatísticas de pedidos' })
  async getOrderStats(@Tenant() clientId: string) {
    this.logger.log(`Obtendo estatísticas de pedidos para clientId: ${clientId}`);
    return await this.ordersService.getOrderStats(clientId);
  }

  @Get()
  @Cacheable({
    key: 'orders:list',
    ttl: 300, // 5 minutos
    tags: ['orders', 'list'],
  })
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    this.logger.log(`Listando pedidos para clientId: ${clientId}`);
    return await this.ordersService.findAll(query);
  }

  @Get(':id')
  @Cacheable({
    key: 'orders:detail',
    ttl: 300, // 5 minutos
    tags: ['orders', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Buscando pedido ${id} para clientId: ${clientId}`);
    return await this.ordersService.findOne(id);
  }

  @Post()
  @CacheInvalidate('orders:list')
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createOrderDto: any, @Tenant() clientId: string) {
    this.logger.log(`Criando pedido para clientId: ${clientId}`);
    const order = await this.ordersService.create(createOrderDto);

    return order;
  }

  @Patch(':id')
  @CacheInvalidate('orders:list')
  @ApiOperation({ summary: 'Atualizar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async update(@Param('id') id: string, @Body() updateOrderDto: any, @Tenant() clientId: string) {
    this.logger.log(`Atualizando pedido ${id} para clientId: ${clientId}`);
    const order = await this.ordersService.update(id, updateOrderDto);

    // Invalidar cache específico do pedido atualizado
    await this.cacheService.delete(`orders:detail:${id}`);

    return order;
  }

  @Delete(':id')
  @CacheInvalidate('orders:list')
  @ApiOperation({ summary: 'Deletar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando pedido ${id} para clientId: ${clientId}`);
    await this.ordersService.remove(id);

    // Invalidar cache específico do pedido removido
    await this.cacheService.delete(`orders:detail:${id}`);

    return { success: true, message: 'Pedido deletado com sucesso' };
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de pedidos' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['orders']);
    return { success: true, message: 'Cache de pedidos limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de pedidos' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
