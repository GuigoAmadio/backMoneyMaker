import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obter estatísticas completas do dashboard BemMeCare
   */
  async getStats(clientId: string) {
    console.log(`🔍 [DashboardService] Iniciando getStats para clientId: ${clientId}`);

    // Métricas principais
    const [
      totalSalesAmount,
      totalProductsSold,
      totalProducts,
      consultationsToday,
      consultationsThisMonth,
      monthlyRevenue,
      websiteVisits, // Mock por enquanto
      topSellingProducts,
      todayAppointments,
      monthlyAppointmentsRevenue,
    ] = await Promise.all([
      this.getTotalSalesAmount(clientId),
      this.getTotalProductsSold(clientId),
      this.getTotalProducts(clientId),
      this.getConsultationsToday(clientId),
      this.getConsultationsThisMonth(clientId),
      this.getMonthlyRevenue(clientId),
      this.getWebsiteVisitsMock(), // Mock por enquanto
      this.getTopSellingProducts(clientId),
      this.getTodayAppointments(clientId),
      this.getMonthlyAppointmentsRevenue(clientId),
    ]);

    // Log detalhado dos dados obtidos
    console.log(`📊 [DashboardService] Dados coletados para clientId ${clientId}:`);
    console.log(`  • totalSalesAmount: ${totalSalesAmount}`);
    console.log(`  • totalProductsSold: ${totalProductsSold}`);
    console.log(`  • totalProducts: ${totalProducts}`);
    console.log(`  • consultationsToday: ${consultationsToday}`);
    console.log(`  • consultationsThisMonth: ${consultationsThisMonth}`);
    console.log(`  • monthlyRevenue: ${monthlyRevenue}`);
    console.log(`  • websiteVisits: ${websiteVisits}`);
    console.log(`  • topSellingProducts: ${JSON.stringify(topSellingProducts, null, 2)}`);
    console.log(`  • todayAppointments: ${JSON.stringify(todayAppointments, null, 2)}`);
    console.log(`  • monthlyAppointmentsRevenue: ${monthlyAppointmentsRevenue}`);

    const lowStockProducts = await this.getLowStockProducts(clientId);
    const pendingOrders = await this.getPendingOrders(clientId);

    console.log(`  • lowStockProducts: ${lowStockProducts}`);
    console.log(`  • pendingOrders: ${pendingOrders}`);

    const result = {
      mainMetrics: {
        websiteVisits,
        totalSalesAmount,
        totalProductsSold,
        monthlyRevenue,
      },
      topSellingProducts,
      today: {
        count: consultationsToday,
        revenue: await this.getTodayAppointmentsRevenue(clientId),
      },
      month: {
        count: consultationsThisMonth,
        revenue: monthlyAppointmentsRevenue,
      },
      todayAppointments,
      overview: {
        totalProducts,
        lowStockProducts,
        pendingOrders,
      },
    };

    console.log(`✅ [DashboardService] Resultado final para clientId ${clientId}:`);
    console.log(JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * Valor total vendido (soma de todos os orders pagos)
   */
  private async getTotalSalesAmount(clientId: string): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        clientId,
        paymentStatus: 'PAID',
      },
      _sum: {
        total: true,
      },
    });
    return Number(result._sum.total) || 0;
  }

  /**
   * Quantidade total de produtos vendidos
   */
  private async getTotalProductsSold(clientId: string): Promise<number> {
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
  private async getConsultationsToday(clientId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.prisma.appointment.count({
      where: {
        clientId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  /**
   * Consultas deste mês
   */
  private async getConsultationsThisMonth(clientId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return await this.prisma.appointment.count({
      where: {
        clientId,
        startTime: {
          gte: startOfMonth,
        },
      },
    });
  }

  /**
   * Receita mensal (orders pagos do mês atual)
   */
  private async getMonthlyRevenue(clientId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.order.aggregate({
      where: {
        clientId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
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
  private async getTopSellingProducts(clientId: string) {
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
      take: 5,
    });

    // Buscar detalhes dos produtos
    const productIds = topProducts.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        clientId,
      },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
      },
    });

    // Combinar dados
    return topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Produto não encontrado',
        description: product?.description || '',
        price: Number(product?.price) || 0,
        quantitySold: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.subtotal) || 0,
      };
    });
  }

  /**
   * Agendamentos de hoje com detalhes
   */
  private async getTodayAppointments(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        service: {
          select: {
            name: true,
            price: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Receita dos agendamentos de hoje
   */
  private async getTodayAppointmentsRevenue(clientId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    return appointments.reduce((total, appointment) => {
      return total + (Number(appointment.service?.price) || 0);
    }, 0);
  }

  /**
   * Receita mensal dos agendamentos
   */
  private async getMonthlyAppointmentsRevenue(clientId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: {
          gte: startOfMonth,
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    return appointments.reduce((total, appointment) => {
      return total + (Number(appointment.service?.price) || 0);
    }, 0);
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
