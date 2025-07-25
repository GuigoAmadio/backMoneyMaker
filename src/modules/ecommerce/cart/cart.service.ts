import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  // Buscar carrinho do usuário
  async getCart(userId: string, clientId: string) {
    this.logger.log(`Obtendo carrinho do usuário ${userId} para clientId: ${clientId}`);

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `ecommerce:cart:user:${userId}`;
      const cachedCart = await this.cacheService.get(cacheKey);

      if (cachedCart) {
        this.logger.debug(`Carrinho obtido do cache para usuário ${userId}`);
        return cachedCart;
      }

      this.logger.log(`Cache miss - buscando carrinho do banco para usuário ${userId}`);

      const cart = await this.getActiveCart(userId);

      // Salvar no cache por 5 minutos
      await this.cacheService.set(cacheKey, cart, clientId, {
        ttl: 300,
        tags: ['ecommerce', 'cart'],
      });

      this.logger.log(`Carrinho obtido com sucesso para usuário ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error(`Erro ao obter carrinho para usuário ${userId}`, error);
      throw error;
    }
  }

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

  // Adicionar item ao carrinho
  async addItem(userId: string, itemData: any, clientId: string) {
    this.logger.log(`Adicionando item ao carrinho do usuário ${userId} para clientId: ${clientId}`);
    this.logger.debug(`Dados do item: ${JSON.stringify(itemData)}`);

    try {
      const cart = await this.getActiveCart(userId);

      // Verificar se item já existe
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: itemData.productId,
        },
      });

      if (existingItem) {
        // Atualizar quantidade
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + itemData.quantity,
          },
        });
      } else {
        // Criar novo item
        await this.prisma.cartItem.create({
          data: {
            id: crypto.randomUUID(),
            cartId: cart.id,
            productId: itemData.productId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice || 0,
            totalPrice: (itemData.unitPrice || 0) * itemData.quantity,
          },
        });
      }

      const updatedCart = await this.getActiveCart(userId);
      this.logger.log(`Item adicionado com sucesso ao carrinho do usuário ${userId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Erro ao adicionar item ao carrinho do usuário ${userId}`, error);
      throw error;
    }
  }

  // Atualizar item do carrinho
  async updateItem(userId: string, itemId: string, updateData: any, clientId: string) {
    this.logger.log(
      `Atualizando item ${itemId} do carrinho do usuário ${userId} para clientId: ${clientId}`,
    );
    this.logger.debug(`Dados de atualização: ${JSON.stringify(updateData)}`);

    try {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: updateData.quantity,
          unitPrice: updateData.unitPrice,
          totalPrice: (updateData.unitPrice || 0) * updateData.quantity,
        },
      });

      const updatedCart = await this.getActiveCart(userId);
      this.logger.log(`Item atualizado com sucesso no carrinho do usuário ${userId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Erro ao atualizar item do carrinho do usuário ${userId}`, error);
      throw error;
    }
  }

  // Remover item do carrinho
  async removeItem(userId: string, itemId: string, clientId: string) {
    this.logger.log(
      `Removendo item ${itemId} do carrinho do usuário ${userId} para clientId: ${clientId}`,
    );

    try {
      await this.prisma.cartItem.delete({
        where: { id: itemId },
      });

      const updatedCart = await this.getActiveCart(userId);
      this.logger.log(`Item removido com sucesso do carrinho do usuário ${userId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Erro ao remover item do carrinho do usuário ${userId}`, error);
      throw error;
    }
  }

  // Limpar carrinho
  async clearCart(userId: string, clientId: string) {
    this.logger.log(`Limpando carrinho do usuário ${userId} para clientId: ${clientId}`);

    try {
      const cart = await this.getActiveCart(userId);

      // Remover todos os itens do carrinho
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      this.logger.log(`Carrinho limpo com sucesso para usuário ${userId}`);
      return { success: true, message: 'Carrinho limpo com sucesso' };
    } catch (error) {
      this.logger.error(`Erro ao limpar carrinho do usuário ${userId}`, error);
      throw error;
    }
  }

  // Adicionar produto ao carrinho (método legado)
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

  // Remover item do carrinho (método legado)
  async removeFromCart(customerId: string, cartItemId: string) {
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getActiveCart(customerId);
  }
}
