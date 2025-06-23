import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obter estatísticas de produtos
   */
  async getProductStats(clientId: string) {
    const [
      totalProducts,
      totalSoldValue,
      totalSoldQuantity,
      lowStockCount,
      outOfStockCount,
      averagePrice,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.product.count({ where: { clientId } }),
      this.getTotalSoldValue(clientId),
      this.getTotalSoldQuantity(clientId),
      this.prisma.product.count({ where: { clientId, stock: { lte: 10 } } }),
      this.prisma.product.count({ where: { clientId, stock: 0 } }),
      this.getAveragePrice(clientId),
      this.getMonthlyRevenue(clientId),
    ]);

    return {
      success: true,
      data: {
        totalProducts,
        totalSoldValue,
        totalSoldQuantity,
        lowStockCount,
        outOfStockCount,
        averagePrice,
        monthlyRevenue,
        metrics: {
          productsInStock: totalProducts - outOfStockCount,
          inventoryValue: await this.getInventoryValue(clientId),
          topSellingCategory: await this.getTopSellingCategory(clientId),
        },
      },
    };
  }

  /**
   * Obter produtos mais vendidos
   */
  async getTopSellingProducts(clientId: string, limit: number = 5) {
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Buscar detalhes dos produtos
    const productIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        clientId,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Combinar dados
    const result = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: product?.id,
        name: product?.name,
        category: product?.category?.name || 'Sem categoria',
        price: Number(product?.price) || 0,
        quantitySold: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.subtotal) || 0,
        image: product?.image || null,
      };
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Obter produtos com estoque baixo
   */
  async getLowStockProducts(clientId: string, threshold: number = 10) {
    const products = await this.prisma.product.findMany({
      where: {
        clientId,
        stock: {
          lte: threshold,
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    return {
      success: true,
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stock: product.stock,
        category: product.category?.name || 'Sem categoria',
        isOutOfStock: product.stock === 0,
        image: product.image || null,
      })),
    };
  }

  /**
   * Listar produtos com filtros
   */
  async findAll(clientId: string, filters: any = {}) {
    const { category, search, isActive, lowStock, page = 1, limit = 10 } = filters;

    const where: any = { clientId };

    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (lowStock) {
      where.stock = { lte: { stock: { gte: 0 } } };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: products.map((product) => ({
        ...product,
        price: Number(product.price),
        category: product.category?.name || 'Sem categoria',
        isOutOfStock: product.stock === 0,
        image: product.image || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar produto por ID
   */
  async findOne(id: string, clientId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, clientId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            subtotal: true,
            order: {
              select: {
                createdAt: true,
                paymentStatus: true,
              },
            },
          },
          where: {
            order: {
              paymentStatus: 'PAID',
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Calcular estatísticas de vendas
    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = product.orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    return {
      success: true,
      data: {
        ...product,
        price: Number(product.price),
        categoryId: product.categoryId,
        category: product.category,
        images: product.image ? [product.image] : [],
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        stats: {
          totalSold,
          totalRevenue,
          lastSaleDate:
            product.orderItems.length > 0
              ? product.orderItems[product.orderItems.length - 1].order.createdAt
              : null,
        },
      },
    };
  }

  /**
   * Criar produto
   */
  async create(data: any, clientId: string) {
    const product = await this.prisma.product.create({
      data: {
        ...data,
        clientId,
        price: Number(data.price),
        stock: Number(data.stock) || 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...product,
        price: Number(product.price),
      },
      message: 'Produto criado com sucesso',
    };
  }

  /**
   * Atualizar produto
   */
  async update(id: string, data: any, clientId: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: { id, clientId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    const updatedData = { ...data };
    if (data.price !== undefined) {
      updatedData.price = Number(data.price);
    }
    if (data.stock !== undefined) {
      updatedData.stock = Number(data.stock);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updatedData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...product,
        price: Number(product.price),
      },
      message: 'Produto atualizado com sucesso',
    };
  }

  /**
   * Deletar produto
   */
  async remove(id: string, clientId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, clientId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Produto deletado com sucesso',
    };
  }

  /**
   * Atualizar estoque
   */
  async updateStock(id: string, stock: number, clientId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, clientId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: Number(stock) },
    });

    return {
      success: true,
      data: {
        ...updatedProduct,
        price: Number(updatedProduct.price),
      },
      message: 'Estoque atualizado com sucesso',
    };
  }

  // Métodos auxiliares privados
  private async getTotalSoldValue(clientId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        subtotal: true,
      },
    });
    return Number(result._sum.subtotal) || 0;
  }

  private async getTotalSoldQuantity(clientId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  private async getAveragePrice(clientId: string): Promise<number> {
    const result = await this.prisma.product.aggregate({
      where: { clientId },
      _avg: {
        price: true,
      },
    });
    return Number(result._avg.price) || 0;
  }

  private async getMonthlyRevenue(clientId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
          createdAt: {
            gte: startOfMonth,
          },
        },
      },
      _sum: {
        subtotal: true,
      },
    });
    return Number(result._sum.subtotal) || 0;
  }

  private async getInventoryValue(clientId: string): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { clientId },
      select: {
        price: true,
        stock: true,
      },
    });

    return products.reduce((total, product) => {
      return total + Number(product.price) * product.stock;
    }, 0);
  }

  private async getTopSellingCategory(clientId: string): Promise<string> {
    const topCategory = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 1,
    });

    if (topCategory.length === 0) {
      return 'N/A';
    }

    const product = await this.prisma.product.findUnique({
      where: { id: topCategory[0].productId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return product?.category?.name || 'Sem categoria';
  }

  private async getTotalProductsSold(clientId: string): Promise<number> {
    const result = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          clientId,
          paymentStatus: 'PAID',
        },
      },
      _sum: {
        subtotal: true,
      },
    });
    return Number(result._sum.subtotal) || 0;
  }
}
