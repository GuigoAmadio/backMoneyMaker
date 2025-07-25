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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Cacheable, CacheInvalidate, CacheClear } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';

@ApiTags('Produtos')
@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('stats')
  @Cacheable({
    key: 'products:stats',
    ttl: 600, // 10 minutos
    tags: ['products', 'stats'],
  })
  @ApiOperation({ summary: 'Obter estatísticas de produtos' })
  @ApiResponse({ status: 200, description: 'Estatísticas de produtos' })
  async getProductStats(@Tenant() clientId: string) {
    return await this.productsService.getProductStats(clientId);
  }

  @Get('top-selling')
  @Cacheable({
    key: 'products:top-selling',
    ttl: 900, // 15 minutos
    tags: ['products', 'top-selling'],
  })
  @ApiOperation({ summary: 'Obter produtos mais vendidos' })
  @ApiResponse({ status: 200, description: 'Lista de produtos mais vendidos' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de produtos' })
  async getTopSellingProducts(@Tenant() clientId: string, @Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 5;
    return await this.productsService.getTopSellingProducts(clientId, limitNumber);
  }

  @Get('low-stock')
  @Cacheable({
    key: 'products:low-stock',
    ttl: 300, // 5 minutos
    tags: ['products', 'low-stock'],
  })
  @ApiOperation({ summary: 'Obter produtos com estoque baixo' })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Limite do estoque' })
  async getLowStockProducts(@Tenant() clientId: string, @Query('threshold') threshold?: string) {
    const thresholdNumber = threshold ? parseInt(threshold) : 10;
    return await this.productsService.getLowStockProducts(clientId, thresholdNumber);
  }

  @Get()
  @Cacheable({
    key: 'products:list',
    ttl: 300, // 5 minutos
    tags: ['products', 'list'],
  })
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou descrição' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'lowStock', required: false, description: 'Produtos com estoque baixo' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Preço mínimo' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Preço máximo' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    const filters = {
      search: query.search,
      category: query.category,
      isActive: query.isActive === 'true',
      lowStock: query.lowStock === 'true',
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    };

    return await this.productsService.findAll(clientId, filters);
  }

  @Get(':id')
  @Cacheable({
    key: 'products:detail',
    ttl: 600, // 10 minutos
    tags: ['products', 'detail'],
  })
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.productsService.findOne(id, clientId);
  }

  @Post()
  @CacheInvalidate('products:list')
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createProductDto: any, @Tenant() clientId: string) {
    const product = await this.productsService.create(createProductDto, clientId);

    // Invalidar cache específico do produto criado
    if (product.data?.id) {
      await this.cacheService.delete(`products:detail:${product.data.id}`);
    }

    return product;
  }

  @Patch(':id')
  @CacheInvalidate('products:list')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async update(@Param('id') id: string, @Body() updateProductDto: any, @Tenant() clientId: string) {
    const product = await this.productsService.update(id, updateProductDto, clientId);

    // Invalidar cache específico do produto atualizado
    await this.cacheService.delete(`products:detail:${id}`);

    return product;
  }

  @Delete(':id')
  @CacheInvalidate('products:list')
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({ status: 200, description: 'Produto deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    await this.productsService.remove(id, clientId);

    // Invalidar cache específico do produto removido
    await this.cacheService.delete(`products:detail:${id}`);

    return { success: true, message: 'Produto removido com sucesso' };
  }

  @Patch(':id/deactivate')
  @CacheInvalidate('products:list')
  @ApiOperation({ summary: 'Desativar produto' })
  @ApiResponse({ status: 200, description: 'Produto desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async deactivate(@Param('id') id: string, @Tenant() clientId: string) {
    const product = await this.productsService.deactivate(id, clientId);

    // Invalidar cache específico do produto desativado
    await this.cacheService.delete(`products:detail:${id}`);

    return product;
  }

  @Patch(':id/stock')
  @CacheInvalidate('products:list')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado com sucesso' })
  async updateStock(
    @Param('id') id: string,
    @Body('stock') stock: number,
    @Tenant() clientId: string,
  ) {
    const product = await this.productsService.updateStock(id, stock, clientId);

    // Invalidar cache específico do produto com estoque atualizado
    await this.cacheService.delete(`products:detail:${id}`);

    return product;
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de produtos' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['products']);
    return { success: true, message: 'Cache de produtos limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de produtos' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
