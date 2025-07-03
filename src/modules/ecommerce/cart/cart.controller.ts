import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';

@ApiTags('Ecommerce - Cart')
@Controller('ecommerce/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar carrinho do customer' })
  @ApiResponse({ status: 200, description: 'Carrinho retornado com sucesso' })
  async getCart(@Request() req) {
    const customerId = req.customer?.id || 'guest';
    return this.cartService.getActiveCart(customerId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Adicionar produto ao carrinho' })
  @ApiResponse({ status: 201, description: 'Produto adicionado com sucesso' })
  async addToCart(@Request() req, @Body() body: any) {
    const customerId = req.customer?.id || 'guest';
    const { productId, quantity } = body;
    return this.cartService.addToCart(customerId, productId, quantity);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remover item do carrinho' })
  @ApiResponse({ status: 200, description: 'Item removido com sucesso' })
  async removeFromCart(@Request() req, @Param('itemId') itemId: string) {
    const customerId = req.customer?.id || 'guest';
    return this.cartService.removeFromCart(customerId, itemId);
  }
}
