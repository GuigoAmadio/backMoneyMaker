import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Obter estatísticas completas do dashboard BemMeCare
   */
  async getStats(clientId: string, startDate?: string, endDate?: string) {
    this.logger.log(
      `Iniciando coleta de estatísticas do dashboard para clientId: ${clientId} período: ${startDate || 'default'} - ${endDate || 'default'}`,
    );

    try {
      // Tentar obter do cache primeiro (cacheKey inclui período se fornecido)
      const cacheKey =
        startDate && endDate
          ? `dashboard:stats:${clientId}:${startDate}:${endDate}`
          : `dashboard:stats:${clientId}`;
      const cachedStats = await this.cacheService.get(cacheKey);

      if (cachedStats) {
        this.logger.debug(`Estatísticas do dashboard obtidas do cache para clientId: ${clientId}`);
        return cachedStats;
      }

      this.logger.log(`Cache miss - coletando estatísticas do banco para clientId: ${clientId}`);

      // Construir filtros de data uma vez
      const dateFilter = this.buildDateFilter(startDate, endDate);
      const orderDateFilter = this.buildOrderDateFilter(startDate, endDate);

      // Executar queries otimizadas em paralelo
      const [salesStats, appointmentStats, productStats, todayAppointments] = await Promise.all([
        this.getSalesStats(clientId, orderDateFilter),
        this.getAppointmentStats(clientId, dateFilter),
        this.getProductStats(clientId),
        this.getTodayAppointments(clientId, startDate, endDate),
      ]);

      const result = {
        mainMetrics: {
          websiteVisits: this.getWebsiteVisitsMock(),
          totalSalesAmount: salesStats.totalAmount,
          totalProductsSold: salesStats.totalQuantity,
          monthlyRevenue: salesStats.monthlyRevenue,
        },
        topSellingProducts: salesStats.topProducts,
        today: {
          count: appointmentStats.todayCount,
          revenue: appointmentStats.todayRevenue,
        },
        month: {
          count: appointmentStats.monthCount,
          revenue: appointmentStats.monthRevenue,
        },
        todayAppointments,
        overview: {
          totalProducts: productStats.total,
          lowStockProducts: productStats.lowStock,
          pendingOrders: productStats.pendingOrders,
        },
      };

      // Salvar no cache por 5 minutos
      await this.cacheService.set(cacheKey, result, clientId, {
        ttl: 300,
        tags: ['dashboard', 'stats'],
      });

      this.logger.log(
        `Estatísticas do dashboard coletadas e cacheadas com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao coletar estatísticas do dashboard para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Construir filtro de data para appointments
   */
  private buildDateFilter(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }
    return null;
  }

  /**
   * Construir filtro de data para orders
   */
  private buildOrderDateFilter(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }
    return null;
  }

  /**
   * Obter estatísticas de vendas otimizadas
   */
  private async getSalesStats(clientId: string, dateFilter?: any) {
    const where: any = {
      clientId,
      paymentStatus: { equals: 'PAID' },
    };

    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    // Query única para obter múltiplas métricas de vendas
    const [totalStats, topProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where,
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: where,
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Buscar detalhes dos produtos em uma query
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // Calcular receita mensal
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await this.prisma.order.aggregate({
      where: {
        ...where,
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });

    return {
      totalAmount: Number(totalStats._sum.total) || 0,
      totalQuantity: await this.getTotalProductsSold(clientId, dateFilter),
      monthlyRevenue: Number(monthlyRevenue._sum.total) || 0,
      topProducts: topProducts.map((p) => ({
        id: p.productId,
        name: products.find((prod) => prod.id === p.productId)?.name || '',
        quantity: p._sum.quantity,
        revenue: p._sum.totalPrice,
      })),
    };
  }

  /**
   * Obter estatísticas de appointments otimizadas
   */
  private async getAppointmentStats(clientId: string, dateFilter?: any) {
    const where: any = { clientId };
    if (dateFilter) {
      where.startTime = dateFilter;
    }

    // Query única para appointments
    const [todayCount, monthCount, todayRevenue, monthRevenue] = await Promise.all([
      // Appointments de hoje
      this.prisma.appointment.count({
        where: {
          clientId,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      // Appointments do mês
      this.prisma.appointment.count({
        where: {
          clientId,
          startTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Receita de hoje
      this.getTodayAppointmentsRevenue(clientId, dateFilter),
      // Receita do mês
      this.getMonthlyAppointmentsRevenue(clientId, dateFilter),
    ]);

    return {
      todayCount,
      monthCount,
      todayRevenue,
      monthRevenue,
    };
  }

  /**
   * Obter estatísticas de produtos otimizadas
   */
  private async getProductStats(clientId: string) {
    const [total, lowStock, pendingOrders] = await Promise.all([
      this.prisma.product.count({ where: { clientId } }),
      this.prisma.product.count({
        where: {
          clientId,
          stock: { lte: 10 },
        },
      }),
      this.prisma.order.count({
        where: {
          clientId,
          status: 'PENDING',
        },
      }),
    ]);

    return { total, lowStock, pendingOrders };
  }

  /**
   * Valor total vendido (soma de todos os orders pagos)
   */
  private async getTotalSalesAmount(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where: any = {
      clientId,
      paymentStatus: { equals: 'PAID' },
    };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }
    const result = await this.prisma.order.aggregate({
      where,
      _sum: { total: true },
    });
    return Number(result._sum.total) || 0;
  }

  /**
   * Quantidade total de produtos vendidos
   */
  private async getTotalProductsSold(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where: any = {
      order: {
        clientId,
        paymentStatus: { equals: 'PAID' },
      },
    };
    if (startDate && endDate) {
      where.order.createdAt = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }
    const result = await this.prisma.orderItem.aggregate({
      where,
      _sum: { quantity: true },
    });
    return Number(result._sum.quantity) || 0;
  }

  /**
   * Total de produtos cadastrados
   */
  private async getTotalProducts(clientId: string): Promise<number> {
    return await this.prisma.product.count({
      where: { clientId },
    });
  }

  /**
   * Consultas hoje
   */
  private async getConsultationsToday(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    let where: any = { clientId };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      where.startTime = { gte: today, lt: tomorrow };
    }
    return await this.prisma.appointment.count({ where });
  }

  /**
   * Consultas deste mês
   */
  private async getConsultationsThisMonth(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    let where: any = { clientId };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.startTime = { gte: startOfMonth };
    }
    return await this.prisma.appointment.count({ where });
  }

  /**
   * Receita mensal (orders pagos do mês atual)
   */
  private async getMonthlyRevenue(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where: any = {
      clientId,
      paymentStatus: { equals: 'PAID' },
    };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.createdAt = { gte: startOfMonth };
    }
    const result = await this.prisma.order.aggregate({
      where,
      _sum: { total: true },
    });
    return Number(result._sum.total) || 0;
  }

  /**
   * Mock para visitas do site (implementar analytics depois)
   */
  private async getWebsiteVisitsMock(): Promise<number> {
    // Por enquanto retorna um valor mock
    // Futuramente integrar com Google Analytics ou similar
    return Math.floor(Math.random() * 1000) + 2500;
  }

  /**
   * Top 5 produtos mais vendidos
   */
  private async getTopSellingProducts(clientId: string, startDate?: string, endDate?: string) {
    const where: any = {
      order: {
        clientId,
        paymentStatus: { equals: 'PAID' },
      },
    };
    if (startDate && endDate) {
      where.order.createdAt = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    }
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });
    // Buscar detalhes dos produtos
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    return topProducts.map((p) => ({
      id: p.productId,
      name: products.find((prod) => prod.id === p.productId)?.name || '',
      quantity: p._sum.quantity,
      revenue: p._sum.totalPrice,
    }));
  }

  /**
   * Agendamentos de hoje com detalhes
   */
  private async getTodayAppointments(clientId: string, startDate?: string, endDate?: string) {
    let where: any = { clientId };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      where.startTime = { gte: today, lt: tomorrow };
    }
    return await this.prisma.appointment.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        service: { select: { name: true, price: true } },
        user: { select: { name: true, email: true } },
        employee: { select: { name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Receita dos agendamentos de hoje
   */
  private async getTodayAppointmentsRevenue(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    let where: any = { clientId, status: 'COMPLETED' };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      where.startTime = { gte: today, lt: tomorrow };
    }
    const appointments = await this.prisma.appointment.findMany({
      where,
      select: { service: { select: { price: true } } },
    });
    return appointments.reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);
  }

  /**
   * Receita mensal dos agendamentos
   */
  private async getMonthlyAppointmentsRevenue(
    clientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    let where: any = { clientId, status: 'COMPLETED' };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
      };
    } else {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.startTime = { gte: startOfMonth };
    }
    const appointments = await this.prisma.appointment.findMany({
      where,
      select: { service: { select: { price: true } } },
    });
    return appointments.reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);
  }

  /**
   * Produtos com estoque baixo
   */
  private async getLowStockProducts(clientId: string): Promise<number> {
    return await this.prisma.product.count({
      where: {
        clientId,
        stock: {
          lte: 10,
        },
      },
    });
  }

  /**
   * Pedidos pendentes
   */
  private async getPendingOrders(clientId: string): Promise<number> {
    return await this.prisma.order.count({
      where: {
        clientId,
        status: 'PENDING',
      },
    });
  }
}
