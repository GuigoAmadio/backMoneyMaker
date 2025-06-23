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

@ApiTags('Produtos')
@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de produtos' })
  @ApiResponse({ status: 200, description: 'Estatísticas de produtos' })
  async getProductStats(@Tenant() clientId: string) {
    return await this.productsService.getProductStats(clientId);
  }

  @Get('top-selling')
  @ApiOperation({ summary: 'Obter produtos mais vendidos' })
  @ApiResponse({ status: 200, description: 'Lista de produtos mais vendidos' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de produtos' })
  async getTopSellingProducts(@Tenant() clientId: string, @Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 5;
    return await this.productsService.getTopSellingProducts(clientId, limitNumber);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Obter produtos com estoque baixo' })
  @ApiResponse({ status: 200, description: 'Lista de produtos com estoque baixo' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Limite do estoque' })
  async getLowStockProducts(@Tenant() clientId: string, @Query('threshold') threshold?: string) {
    const thresholdNumber = threshold ? parseInt(threshold) : 10;
    return await this.productsService.getLowStockProducts(clientId, thresholdNumber);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou descrição' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'lowStock', required: false, description: 'Produtos com estoque baixo' })
  async findAll(@Tenant() clientId: string, @Query() query: any) {
    const filters = {
      search: query.search,
      category: query.category,
      isActive: query.isActive === 'true',
      lowStock: query.lowStock === 'true',
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    };

    return await this.productsService.findAll(clientId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.productsService.findOne(id, clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createProductDto: any, @Tenant() clientId: string) {
    return await this.productsService.create(createProductDto, clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async update(@Param('id') id: string, @Body() updateProductDto: any, @Tenant() clientId: string) {
    return await this.productsService.update(id, updateProductDto, clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({ status: 200, description: 'Produto deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.productsService.remove(id, clientId);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado com sucesso' })
  async updateStock(
    @Param('id') id: string,
    @Body('stock') stock: number,
    @Tenant() clientId: string,
  ) {
    return await this.productsService.updateStock(id, stock, clientId);
  }
}
