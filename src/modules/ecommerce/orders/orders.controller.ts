import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Ecommerce - Orders')
@Controller('ecommerce/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('from-cart')
  @ApiOperation({ summary: 'Criar pedido a partir do carrinho' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  async createOrderFromCart(@Request() req, @Body() createOrderDto: any) {
    const customerId = req.customer?.id || 'guest';
    return this.ordersService.createOrderFromCart(customerId, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Buscar meus pedidos' })
  async getMyOrders(@Request() req) {
    const customerId = req.customer?.id || 'guest';
    return this.ordersService.getCustomerOrders(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  async getOrder(@Request() req, @Param('id') id: string) {
    const customerId = req.customer?.id || 'guest';
    return this.ordersService.getOrderById(customerId, id);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Buscar todos pedidos (admin)' })
  async getAllOrders(@Request() req) {
    const clientId = req.clientId || 'default';
    return this.ordersService.getAllOrders(clientId);
  }
}
