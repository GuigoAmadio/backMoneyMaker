import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';

/**
 * Data Agent Service
 *
 * Responsible for querying business data based on user requests
 * Handles products, clients, appointments, orders, and finances
 */
@Injectable()
export class DataAgentService {
  private readonly logger = new Logger(DataAgentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query data from the database based on entity and filters
   */
  async queryData(entity: string, filters: any, userId: string, clientId: string): Promise<any> {
    try {
      switch (entity) {
        case 'products':
          return await this.queryProducts(filters, clientId);
        case 'clients':
          return await this.queryClients(filters, clientId);
        case 'appointments':
          return await this.queryAppointments(filters, userId);
        case 'orders':
          return await this.queryOrders(filters, clientId);
        case 'finances':
          return await this.queryFinances(filters, clientId);
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }
    } catch (error) {
      this.logger.error(`Failed to query ${entity}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query products
   */
  private async queryProducts(filters: any, clientId: string) {
    const where: any = { clientId };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.category) {
      where.categoryId = filters.category;
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    return await this.prisma.product.findMany({
      where,
      take: filters.limit || 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        categoryId: true,
        isActive: true,
      },
    });
  }

  /**
   * Query clients
   */
  private async queryClients(filters: any, clientId: string) {
    // NOTE: Client não tem relação direta com workspace aqui
    // Este método retorna info do próprio client
    const where: any = { id: clientId };

    return await this.prisma.client.findMany({
      where,
      take: filters.limit || 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        activeServices: true,
        createdAt: true,
      },
    });
  }

  /**
   * Query appointments
   */
  private async queryAppointments(filters: any, userId: string) {
    const where: any = { userId };

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return await this.prisma.schedule.findMany({
      where,
      take: filters.limit || 10,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Query orders
   */
  private async queryOrders(filters: any, clientId: string) {
    const where: any = { clientId };

    if (filters.status) {
      where.status = filters.status;
    }

    return await this.prisma.order.findMany({
      where,
      take: filters.limit || 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Query finances
   */
  private async queryFinances(filters: any, clientId: string) {
    const where: any = { clientId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    return await this.prisma.transaction.findMany({
      where,
      take: filters.limit || 10,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        categoryId: true,
        description: true,
        date: true,
      },
    });
  }

  /**
   * Get statistics for an entity
   */
  async getStats(entity: string, userId: string, clientId: string): Promise<any> {
    try {
      switch (entity) {
        case 'products':
          return await this.getProductStats(clientId);
        case 'clients':
          return await this.getClientStats(clientId);
        case 'appointments':
          return await this.getAppointmentStats(userId);
        case 'finances':
          return await this.getFinanceStats(clientId);
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get stats for ${entity}: ${error.message}`);
      throw error;
    }
  }

  private async getProductStats(clientId: string) {
    const [total, active, lowStock, totalValue] = await Promise.all([
      this.prisma.product.count({ where: { clientId } }),
      this.prisma.product.count({ where: { clientId, isActive: true } }),
      this.prisma.product.count({
        where: { clientId, stock: { lt: 10 } },
      }),
      this.prisma.product.aggregate({
        where: { clientId },
        _sum: { price: true },
      }),
    ]);

    return { 
      total, 
      active, 
      lowStock, 
      totalValue: totalValue._sum.price ? Number(totalValue._sum.price) : 0 
    };
  }

  private async getClientStats(clientId: string) {
    // Retorna apenas 1 pois é o próprio client
    return { total: 1 };
  }

  private async getAppointmentStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, today_count] = await Promise.all([
      this.prisma.schedule.count({ where: { userId } }),
      this.prisma.schedule.count({
        where: { userId, date: { gte: today } },
      }),
    ]);

    return { total, today: today_count };
  }

  private async getFinanceStats(clientId: string) {
    const [income, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { clientId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { clientId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const incomeValue = income._sum.amount ? Number(income._sum.amount) : 0;
    const expenseValue = expenses._sum.amount ? Number(expenses._sum.amount) : 0;

    return {
      income: incomeValue,
      expenses: expenseValue,
      balance: incomeValue - expenseValue,
    };
  }
}
