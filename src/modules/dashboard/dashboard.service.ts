import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obter estatísticas gerais do dashboard
   */
  async getStats(clientId: string) {
    const [totalClients, activeClients, pendingPayments, monthlyRevenue, upcomingAppointments] =
      await Promise.all([
        this.prisma.client.count({ where: { id: clientId } }),
        this.prisma.client.count({ where: { id: clientId, status: 'ACTIVE' } }),
        this.prisma.order.count({ where: { clientId, status: 'PENDING' } }),
        this.prisma.order
          .aggregate({
            where: {
              clientId,
              paymentStatus: 'PAID',
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
            _sum: { total: true },
          })
          .then((res) => res._sum.total || 0),
        this.prisma.appointment.count({ where: { clientId, startTime: { gte: new Date() } } }),
      ]);

    return {
      totalClients,
      activeClients,
      pendingPayments,
      monthlyRevenue,
      upcomingAppointments,
    };
  }
}
