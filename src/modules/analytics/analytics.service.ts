import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ===== DADOS DOS MÓDULOS EXISTENTES =====

  /**
   * Analytics de E-commerce
   * Agrega dados dos módulos de Orders, Products, Cart
   */
  async getEcommerceAnalytics(clientId: string, period: string) {
    const dateFilter = this.getDateFilter(period);

    // Vendas totais
    const totalRevenue = await this.prisma.order.aggregate({
      where: {
        clientId,
        status: 'DELIVERED',
        createdAt: dateFilter,
      },
      _sum: { total: true },
    });

    // Total de pedidos
    const totalOrders = await this.prisma.order.count({
      where: {
        clientId,
        createdAt: dateFilter,
      },
    });

    // Produtos mais vendidos
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          clientId,
          createdAt: dateFilter,
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Ticket médio
    const avgOrderValue = await this.prisma.order.aggregate({
      where: {
        clientId,
        status: 'DELIVERED',
        createdAt: dateFilter,
      },
      _avg: { total: true },
    });

    return {
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalOrders,
      avgOrderValue: Number(avgOrderValue._avg.total || 0),
      topProducts,
    };
  }

  /**
   * Analytics de Agendamentos
   * Agrega dados do módulo de Appointments
   */
  async getAppointmentsAnalytics(clientId: string, period: string) {
    const dateFilter = this.getDateFilter(period);

    // Total de agendamentos
    const totalAppointments = await this.prisma.appointment.count({
      where: {
        clientId,
        createdAt: dateFilter,
      },
    });

    // Taxa de comparecimento
    const completedAppointments = await this.prisma.appointment.count({
      where: {
        clientId,
        status: 'COMPLETED',
        createdAt: dateFilter,
      },
    });

    const noShowAppointments = await this.prisma.appointment.count({
      where: {
        clientId,
        status: 'NO_SHOW',
        createdAt: dateFilter,
      },
    });

    const attendanceRate =
      totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    // Horários mais populares
    const popularHours = await this.prisma.appointment.groupBy({
      by: ['startTime'],
      where: {
        clientId,
        createdAt: dateFilter,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return {
      totalAppointments,
      completedAppointments,
      noShowAppointments,
      attendanceRate,
      popularHours,
    };
  }

  /**
   * Analytics de Usuários
   * Agrega dados do módulo de Users
   */
  async getUsersAnalytics(clientId: string, period: string) {
    const dateFilter = this.getDateFilter(period);

    // Total de usuários
    const totalUsers = await this.prisma.user.count({
      where: { clientId },
    });

    // Novos usuários no período
    const newUsers = await this.prisma.user.count({
      where: {
        clientId,
        createdAt: dateFilter,
      },
    });

    // Usuários ativos (que fizeram login recentemente)
    const activeUsers = await this.prisma.user.count({
      where: {
        clientId,
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      },
    });

    // Taxa de retenção (usuários que voltaram)
    const returningUsers = await this.prisma.user.count({
      where: {
        clientId,
        lastLogin: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
        createdAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Criados há mais de 7 dias
        },
      },
    });

    return {
      totalUsers,
      newUsers,
      activeUsers,
      returningUsers,
    };
  }

  // ===== DADOS DE TRACKING DE EVENTOS =====

  /**
   * Registra eventos de tracking (page views, clicks, etc.)
   * TEMPORARIAMENTE COMENTADO - Aguardando migração das tabelas de analytics
   */
  async trackEvent(
    clientId: string,
    event: {
      type: 'page_view' | 'click' | 'conversion' | 'api_call';
      userId?: string;
      sessionId?: string;
      data?: any;
    },
  ) {
    // TODO: Implementar após criar migração das tabelas analytics
    console.log('Analytics event tracked:', { clientId, event });
    return {
      id: 'temp-id',
      clientId,
      eventType: event.type,
      userId: event.userId,
      sessionId: event.sessionId,
      eventData: event.data || {},
      timestamp: new Date(),
    };
  }

  /**
   * Analytics de comportamento (baseado em eventos)
   * TEMPORARIAMENTE COM DADOS MOCKADOS - Aguardando migração das tabelas de analytics
   */
  async getBehaviorAnalytics(clientId: string, period: string) {
    // TODO: Implementar após criar migração das tabelas analytics
    // Por enquanto, retornar dados mockados
    return {
      pageViews: 1250,
      uniqueSessions: 890,
      conversions: 45,
      avgSessionDuration: 145, // em minutos
      conversionRate: 3.6, // porcentagem
    };
  }

  // ===== MÉTODO PRINCIPAL QUE AGRAGA TUDO =====

  async getClientAnalytics(clientId: string, filters: any) {
    const { period = 'month' } = filters;

    const [ecommerceData, appointmentsData, usersData, behaviorData] = await Promise.all([
      this.getEcommerceAnalytics(clientId, period),
      this.getAppointmentsAnalytics(clientId, period),
      this.getUsersAnalytics(clientId, period),
      this.getBehaviorAnalytics(clientId, period),
    ]);

    // Retornar no formato esperado pelo frontend
    return {
      clientId,
      period,
      metrics: {
        totalUsers: usersData.totalUsers,
        activeUsers: usersData.activeUsers,
        totalAppointments: appointmentsData.totalAppointments,
        totalTransactions: ecommerceData.totalOrders,
        totalRevenue: ecommerceData.totalRevenue,
        totalExpenses: 0, // TODO: Implementar quando tivermos dados de despesas
        netProfit: ecommerceData.totalRevenue, // Simplificado por enquanto
        conversionRate: behaviorData.conversionRate,
        averageOrderValue: ecommerceData.avgOrderValue,
        customerRetentionRate:
          usersData.returningUsers > 0
            ? (usersData.returningUsers / usersData.totalUsers) * 100
            : 0,
      },
      trends: {
        users: [
          { date: '2024-01-01', value: usersData.newUsers },
          { date: '2024-01-02', value: usersData.newUsers + 5 },
        ],
        appointments: [
          { date: '2024-01-01', value: appointmentsData.totalAppointments },
          { date: '2024-01-02', value: appointmentsData.totalAppointments + 3 },
        ],
        revenue: [
          { date: '2024-01-01', value: Number(ecommerceData.totalRevenue) * 0.4 },
          { date: '2024-01-02', value: Number(ecommerceData.totalRevenue) * 0.6 },
        ],
        expenses: [
          { date: '2024-01-01', value: 0 },
          { date: '2024-01-02', value: 0 },
        ],
      },
      breakdowns: {
        byService: [
          {
            category: 'E-commerce',
            value: Number(ecommerceData.totalRevenue),
            percentage: 60,
            count: ecommerceData.totalOrders,
            trend: 5,
          },
          {
            category: 'Agendamentos',
            value: appointmentsData.totalAppointments * 100,
            percentage: 40,
            count: appointmentsData.totalAppointments,
            trend: -2,
          },
        ],
        byCategory: [
          {
            category: 'Produtos',
            value: Number(ecommerceData.totalRevenue) * 0.7,
            percentage: 70,
            count: ecommerceData.totalOrders,
            trend: 3,
          },
          {
            category: 'Serviços',
            value: Number(ecommerceData.totalRevenue) * 0.3,
            percentage: 30,
            count: appointmentsData.totalAppointments,
            trend: -1,
          },
        ],
        byUser: [
          {
            userId: 'user1',
            userName: 'Cliente Ativo',
            userEmail: 'cliente@exemplo.com',
            value: Number(ecommerceData.totalRevenue) * 0.3,
            count: 5,
            percentage: 30,
          },
        ],
        byStatus: [
          {
            status: 'Ativo',
            count: usersData.activeUsers,
            percentage: (usersData.activeUsers / usersData.totalUsers) * 100,
            trend: 2,
          },
          {
            status: 'Inativo',
            count: usersData.totalUsers - usersData.activeUsers,
            percentage:
              ((usersData.totalUsers - usersData.activeUsers) / usersData.totalUsers) * 100,
            trend: -1,
          },
        ],
      },
      insights: [
        {
          id: 'insight1',
          type: 'TREND',
          title: 'Crescimento de Usuários',
          description: `Novos usuários aumentaram ${usersData.newUsers} este período`,
          impact: 'POSITIVE',
          recommendation: 'Continue investindo em marketing',
          data: { newUsers: usersData.newUsers },
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  // ===== MÉTODOS AUXILIARES =====

  private getDateFilter(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      gte: startDate,
      lte: now,
    };
  }

  private calculateSessionDurations(sessions: any[]): number[] {
    const sessionGroups = sessions.reduce((acc, event) => {
      if (!acc[event.sessionId]) {
        acc[event.sessionId] = [];
      }
      acc[event.sessionId].push(event.timestamp);
      return acc;
    }, {});

    return Object.values(sessionGroups)
      .map((timestamps: any[]) => {
        if (timestamps.length < 2) return 0;
        const start = new Date(timestamps[0]).getTime();
        const end = new Date(timestamps[timestamps.length - 1]).getTime();
        return (end - start) / 1000 / 60; // em minutos
      })
      .filter((duration) => duration > 0);
  }
}
