import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Buscar ou criar carrinho ativo para o customer
  async getActiveCart(customerId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: {
        customerId,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          id: crypto.randomUUID(),
          customerId,
          status: 'ACTIVE',
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  // Adicionar produto ao carrinho
  async addToCart(customerId: string, productId: string, quantity: number) {
    const cart = await this.getActiveCart(customerId);

    // Verificar se item já existe
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Atualizar quantidade
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Criar novo item
      await this.prisma.cartItem.create({
        data: {
          id: crypto.randomUUID(),
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: 0, // TODO: buscar preço do produto
          totalPrice: 0,
        },
      });
    }

    return this.getActiveCart(customerId);
  }

  // Remover item do carrinho
  async removeFromCart(customerId: string, cartItemId: string) {
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getActiveCart(customerId);
  }
}
