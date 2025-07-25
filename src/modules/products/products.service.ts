import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { cleanData, cleanFilters } from '../../common/utils/data-cleaner.util';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Obter estatísticas de produtos
   */
  async getProductStats(clientId: string) {
    this.logger.log(`Obtendo estatísticas de produtos para clientId: ${clientId}`);

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `products:stats:${clientId}`;
      const cachedStats = await this.cacheService.get(cacheKey);

      if (cachedStats) {
        this.logger.debug(`Estatísticas de produtos obtidas do cache para clientId: ${clientId}`);
        return cachedStats;
      }

      this.logger.log(`Cache miss - coletando estatísticas do banco para clientId: ${clientId}`);

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

      const result = {
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

      // Salvar no cache por 10 minutos
      await this.cacheService.set(cacheKey, result, clientId, {
        ttl: 600,
        tags: ['products', 'stats'],
      });

      this.logger.log(
        `Estatísticas de produtos coletadas e cacheadas com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas de produtos para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Obter produtos mais vendidos
   */
  async getTopSellingProducts(clientId: string, limit: number = 5) {
    this.logger.log(`Obtendo produtos mais vendidos para clientId: ${clientId}, limit: ${limit}`);

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `products:top-selling:${clientId}:${limit}`;
      const cachedProducts = await this.cacheService.get(cacheKey);

      if (cachedProducts) {
        this.logger.debug(`Produtos mais vendidos obtidos do cache para clientId: ${clientId}`);
        return cachedProducts;
      }

      this.logger.log(
        `Cache miss - coletando produtos mais vendidos do banco para clientId: ${clientId}`,
      );

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

      const response = {
        success: true,
        data: result,
      };

      // Salvar no cache por 15 minutos
      await this.cacheService.set(cacheKey, response, clientId, {
        ttl: 900,
        tags: ['products', 'top-selling'],
      });

      this.logger.log(
        `Produtos mais vendidos coletados e cacheados com sucesso para clientId: ${clientId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Erro ao obter produtos mais vendidos para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Obter produtos com estoque baixo
   */
  async getLowStockProducts(clientId: string, threshold: number = 10) {
    this.logger.log(
      `Obtendo produtos com estoque baixo para clientId: ${clientId}, threshold: ${threshold}`,
    );

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `products:low-stock:${clientId}:${threshold}`;
      const cachedProducts = await this.cacheService.get(cacheKey);

      if (cachedProducts) {
        this.logger.debug(`Produtos com estoque baixo obtidos do cache para clientId: ${clientId}`);
        return cachedProducts;
      }

      this.logger.log(
        `Cache miss - coletando produtos com estoque baixo do banco para clientId: ${clientId}`,
      );

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

      const result = {
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

      // Salvar no cache por 5 minutos
      await this.cacheService.set(cacheKey, result, clientId, {
        ttl: 300,
        tags: ['products', 'low-stock'],
      });

      this.logger.log(
        `Produtos com estoque baixo coletados e cacheados com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao obter produtos com estoque baixo para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Listar produtos com filtros
   */
  async findAll(clientId: string, filters: any = {}) {
    console.log('🔍 [ProductsService] findAll chamado com:', { clientId, filters });

    const {
      category,
      search,
      isActive,
      lowStock,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filters;
    console.log('📋 [ProductsService] Filtros extraídos:', {
      category,
      search,
      isActive,
      lowStock,
      minPrice,
      maxPrice,
      page,
      limit,
    });

    const where: any = { clientId };
    console.log('🎯 [ProductsService] Where inicial:', where);

    // Aplicar filtros apenas se não forem undefined
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Só aplicar filtro isActive se for explicitamente especificado
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = isActive;
    }
    if (lowStock !== undefined && lowStock !== null && lowStock === true) {
      where.stock = { lte: 10 }; // Produtos com estoque menor ou igual a 10
    }

    // Filtros de preço
    if (minPrice !== undefined && minPrice > 0) {
      where.price = { ...where.price, gte: minPrice };
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      where.price = { ...where.price, lte: maxPrice };
    }

    console.log('🔍 [ProductsService] Where final:', JSON.stringify(where, null, 2));

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

    console.log('📦 [ProductsService] Produtos encontrados:', products.length);
    console.log('📊 [ProductsService] Total de produtos:', total);
    console.log(
      '📋 [ProductsService] Produtos:',
      JSON.stringify(
        products.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId })),
        null,
        2,
      ),
    );

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

    const result = {
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

    console.log('✅ [ProductsService] Retornando resultado:', JSON.stringify(result, null, 2));

    return result;
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
    console.log('🔄 [ProductsService] create chamado com:', { data, clientId });

    // Validar dados obrigatórios
    if (!data.name) {
      throw new Error('Nome do produto é obrigatório');
    }

    if (!data.price || isNaN(Number(data.price))) {
      throw new Error('Preço do produto é obrigatório e deve ser um número válido');
    }

    // Verificar se a categoria existe se for fornecida
    if (data.categoryId) {
      const categoryExists = await this.prisma.category.findFirst({
        where: {
          id: data.categoryId,
          clientId: clientId,
        },
      });

      if (!categoryExists) {
        console.warn('⚠️ [ProductsService] Categoria não encontrada:', data.categoryId);
        // Não falhar, apenas remover o categoryId
        delete data.categoryId;
      }
    }

    const cleanedData = cleanData({
      ...data,
      clientId,
      price: Number(data.price),
      stock: Number(data.stock) || 0,
    });

    console.log('🧹 [ProductsService] Dados limpos:', cleanedData);

    try {
      const product = await this.prisma.product.create({
        data: cleanedData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log('✅ [ProductsService] Produto criado com sucesso:', product);

      return {
        success: true,
        data: {
          ...product,
          price: Number(product.price),
        },
        message: 'Produto criado com sucesso',
      };
    } catch (error) {
      console.error('❌ [ProductsService] Erro ao criar produto:', error);
      throw error;
    }
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

    const updatedData = cleanData({
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
    });

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

    // Verificar se existem pedidos relacionados
    const relatedOrders = await this.prisma.orderItem.findFirst({
      where: { productId: id },
    });

    if (relatedOrders) {
      throw new Error(
        'Não é possível excluir este produto pois existem pedidos relacionados. Considere desativar o produto em vez de excluí-lo.',
      );
    }

    // Verificar se existem itens do carrinho relacionados
    const relatedCartItems = await this.prisma.cartItem.findFirst({
      where: { productId: id },
    });

    if (relatedCartItems) {
      throw new Error(
        'Não é possível excluir este produto pois existem itens no carrinho relacionados. Considere desativar o produto em vez de excluí-lo.',
      );
    }

    // Se não há registros relacionados, pode excluir
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

    const cleanedData = cleanData({ stock: Number(stock) });

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: cleanedData,
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

  /**
   * Desativar produto (alternativa segura à exclusão)
   */
  async deactivate(id: string, clientId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, clientId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Desativar o produto em vez de excluí-lo
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Produto desativado com sucesso',
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
