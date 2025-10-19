import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

// C++ Native Service
import { ProductsNativeService } from './products-native.service';

// DTOs
import { CreateProductDto } from './application/dtos/create-product.dto';

@ApiTags('Produtos')
@Controller({ path: 'products', version: '1' })
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class ProductsController {
  constructor(private readonly productsNativeService: ProductsNativeService) {}

  // ============ ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ============
  @Get('native-status')
  @ApiOperation({ summary: 'Verificar status do C++ Native Addon' })
  async getNativeStatus() {
    return {
      success: true,
      nativeAvailable: this.productsNativeService.isNativeAvailable(),
      message: this.productsNativeService.isNativeAvailable()
        ? '✅ C++ Native Addon está rodando!'
        : '⚠️  C++ Native Addon não disponível. Compile com: npm run build:native',
    };
  }

  @Get('benchmark')
  @ApiOperation({ summary: 'Benchmark de performance: C++ vs TypeScript' })
  async benchmark(@Query('iterations') iterations?: string) {
    const iter = iterations ? parseInt(iterations) : 10000;
    const result = await this.productsNativeService.benchmark(iter);
    return {
      success: true,
      data: result,
    };
  }

  // ============ ROTAS PROTEGIDAS ============
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('native')
  @ApiOperation({ summary: 'Criar novo produto usando C++ nativo (DDD C++)' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso via C++' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createNative(@Body() createProductDto: CreateProductDto, @Tenant() clientId: string) {
    // Usa C++ nativo! Performance extrema!
    return await this.productsNativeService.createProductNative(createProductDto, clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('validate-price')
  @ApiOperation({ summary: 'Validar preço (C++ engine)' })
  async validatePrice(@Body('price') price: number) {
    const result = this.productsNativeService.validatePrice(price);
    return {
      success: true,
      data: result,
      engine: this.productsNativeService.isNativeAvailable() ? 'C++' : 'TypeScript (fallback)',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('validate-stock')
  @ApiOperation({ summary: 'Validar estoque (C++ engine)' })
  async validateStock(@Body('stock') stock: number) {
    const result = this.productsNativeService.validateStock(stock);
    return {
      success: true,
      data: result,
      engine: this.productsNativeService.isNativeAvailable() ? 'C++' : 'TypeScript (fallback)',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('calculate-discount')
  @ApiOperation({ summary: 'Calcular desconto (C++ engine)' })
  async calculateDiscount(@Body() body: { price: number; percentage: number }) {
    const result = this.productsNativeService.calculateDiscount(body.price, body.percentage);
    return {
      success: true,
      data: result,
      engine: this.productsNativeService.isNativeAvailable() ? 'C++' : 'TypeScript (fallback)',
    };
  }
}
