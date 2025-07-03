import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrderFromCart(customerId: string, data: any) {
    return {
      message: 'Implementar criação de pedido do carrinho',
      customerId,
      data,
    };
  }

  async getCustomerOrders(customerId: string, page = 1, limit = 10) {
    try {
      const orders = await this.prisma.ecommerceOrder.findMany({
        where: { customerId },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return { data: orders };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar pedidos' };
    }
  }

  async getOrderById(customerId: string, orderId: string) {
    try {
      const order = await this.prisma.ecommerceOrder.findFirst({
        where: { id: orderId, customerId },
        include: {
          items: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      return order;
    } catch (error) {
      throw new NotFoundException('Pedido não encontrado');
    }
  }

  async getAllOrders(clientId: string, page = 1, limit = 10) {
    try {
      const orders = await this.prisma.ecommerceOrder.findMany({
        where: { clientId },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return { data: orders };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar pedidos' };
    }
  }
}
