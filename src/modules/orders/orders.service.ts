import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/tenant/tenant.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private cacheService: CacheService,
  ) {}

  async create(createOrderDto: any) {
    // Implementação básica - pode ser expandida conforme necessário
    return { message: 'Order creation not implemented yet' };
  }

  async findAll(clientId: string) {
    return this.prisma.order.findMany({
      where: { clientId },
      include: {
        client: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });
  }

  async update(id: string, updateOrderDto: any) {
    // Implementação básica - pode ser expandida conforme necessário
    return { message: 'Order update not implemented yet' };
  }

  async remove(id: string) {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  /**
   * Obter estatísticas de pedidos
   */
  async getOrderStats(clientId: string) {
    this.logger.log(`Obtendo estatísticas de pedidos para clientId: ${clientId}`);

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `orders:stats:${clientId}`;
      const cachedStats = await this.cacheService.get(cacheKey);

      if (cachedStats) {
        this.logger.debug(`Estatísticas de pedidos obtidas do cache para clientId: ${clientId}`);
        return cachedStats;
      }

      this.logger.log(`Cache miss - coletando estatísticas do banco para clientId: ${clientId}`);

      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
      ] = await Promise.all([
        this.prisma.order.count({ where: { clientId } }),
        this.prisma.order.count({ where: { clientId, status: 'PENDING' } }),
        this.prisma.order.count({ where: { clientId, status: 'CONFIRMED' } }),
        this.prisma.order.count({ where: { clientId, status: 'DELIVERED' } }),
        this.prisma.order.count({ where: { clientId, status: 'CANCELLED' } }),
        this.prisma.order.aggregate({
          where: { clientId, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        this.prisma.order.aggregate({
          where: { clientId, status: { not: 'CANCELLED' } },
          _avg: { total: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where: { clientId },
          _count: { status: true },
        }),
      ]);

      this.logger.log(`Estatísticas calculadas para clientId: ${clientId}`);

      const result = {
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          averageOrderValue: averageOrderValue._avg.total || 0,
          ordersByStatus: ordersByStatus.map((item) => ({
            status: item.status,
            count: item._count.status,
          })),
        },
      };

      // Salvar no cache por 10 minutos
      await this.cacheService.set(cacheKey, result, clientId, {
        ttl: 600,
        tags: ['orders', 'stats'],
      });

      this.logger.log(
        `Estatísticas de pedidos coletadas e cacheadas com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas de pedidos para clientId: ${clientId}`, error);
      throw error;
    }
  }
}
