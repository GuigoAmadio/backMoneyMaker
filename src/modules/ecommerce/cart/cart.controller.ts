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
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Tenant } from '../../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../../common/decorators/cache.decorator';
import { CacheService } from '../../../common/cache/cache.service';

@ApiTags('Ecommerce - Carrinho')
@Controller({ path: 'ecommerce/cart', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cacheService: CacheService,
  ) {}

  @Get(':userId')
  @Cacheable({
    key: 'ecommerce:cart:user',
    ttl: 180, // 3 minutos
    tags: ['ecommerce', 'cart', 'user'],
  })
  @ApiOperation({ summary: 'Obter carrinho do usuário' })
  @ApiResponse({ status: 200, description: 'Carrinho encontrado' })
  @ApiResponse({ status: 404, description: 'Carrinho não encontrado' })
  async getCart(@Param('userId') userId: string, @Tenant() clientId: string) {
    this.logger.log(`Obtendo carrinho do usuário ${userId} para clientId: ${clientId}`);
    return await this.cartService.getCart(userId, clientId);
  }

  @Post(':userId/items')
  @CacheInvalidate('ecommerce:cart:user')
  @ApiOperation({ summary: 'Adicionar item ao carrinho' })
  @ApiResponse({ status: 201, description: 'Item adicionado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async addItem(
    @Param('userId') userId: string,
    @Body() itemData: any,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Adicionando item ao carrinho do usuário ${userId} para clientId: ${clientId}`);
    const cart = await this.cartService.addItem(userId, itemData, clientId);

    // Invalidar cache específico do carrinho
    await this.cacheService.delete(`ecommerce:cart:user:${userId}`);

    return cart;
  }

  @Patch(':userId/items/:itemId')
  @CacheInvalidate('ecommerce:cart:user')
  @ApiOperation({ summary: 'Atualizar item do carrinho' })
  @ApiResponse({ status: 200, description: 'Item atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async updateItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Body() updateData: any,
    @Tenant() clientId: string,
  ) {
    this.logger.log(
      `Atualizando item ${itemId} do carrinho do usuário ${userId} para clientId: ${clientId}`,
    );
    const cart = await this.cartService.updateItem(userId, itemId, updateData, clientId);

    // Invalidar cache específico do carrinho
    await this.cacheService.delete(`ecommerce:cart:user:${userId}`);

    return cart;
  }

  @Delete(':userId/items/:itemId')
  @CacheInvalidate('ecommerce:cart:user')
  @ApiOperation({ summary: 'Remover item do carrinho' })
  @ApiResponse({ status: 200, description: 'Item removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async removeItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Tenant() clientId: string,
  ) {
    this.logger.log(
      `Removendo item ${itemId} do carrinho do usuário ${userId} para clientId: ${clientId}`,
    );
    const cart = await this.cartService.removeItem(userId, itemId, clientId);

    // Invalidar cache específico do carrinho
    await this.cacheService.delete(`ecommerce:cart:user:${userId}`);

    return cart;
  }

  @Delete(':userId/clear')
  @CacheInvalidate('ecommerce:cart:user')
  @ApiOperation({ summary: 'Limpar carrinho' })
  @ApiResponse({ status: 200, description: 'Carrinho limpo com sucesso' })
  async clearCart(@Param('userId') userId: string, @Tenant() clientId: string) {
    this.logger.log(`Limpando carrinho do usuário ${userId} para clientId: ${clientId}`);
    await this.cartService.clearCart(userId, clientId);

    // Invalidar cache específico do carrinho
    await this.cacheService.delete(`ecommerce:cart:user:${userId}`);

    return { success: true, message: 'Carrinho limpo com sucesso' };
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de carrinhos do ecommerce' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['ecommerce', 'cart']);
    return { success: true, message: 'Cache de carrinhos do ecommerce limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de carrinhos do ecommerce' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
