import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface DashboardStats {
  totalAppointments: number;
  totalClients: number;
  totalEmployees: number;
  totalRevenue: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  recentActivity: any[];
  upcomingAppointments: any[];
}

export interface MonthlyAnalytics {
  appointmentsByDay: any[];
  revenueByDay: any[];
  clientsGrowth: any[];
  servicePopularity: any[];
}

export interface PersonalAnalytics {
  myAppointmentsToday: number;
  myAppointmentsThisWeek: number;
  myAppointmentsThisMonth: number;
  myClients: number;
  myRevenue: number;
  recentAppointments: any[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboardStats(clientId: string, userRole: string): Promise<DashboardStats> {
    this.logger.log(
      `📊 [DashboardService] Obtendo stats para cliente: ${clientId}, role: ${userRole}`,
    );

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar dados básicos
    const [
      totalAppointments,
      totalClients,
      totalEmployees,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      recentAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: { clientId } }),
      this.prisma.user.count({
        where: {
          clientId,
          role: 'CLIENT',
        },
      }),
      this.prisma.employee.count({ where: { clientId } }),
      this.prisma.appointment.count({
        where: {
          clientId,
          startTime: { gte: startOfDay },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clientId,
          startTime: { gte: startOfWeek },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clientId,
          startTime: { gte: startOfMonth },
        },
      }),
      this.prisma.appointment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          employee: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    // Calcular receita total (simulado - ajustar conforme seu modelo)
    const totalRevenue = totalAppointments * 150; // Valor médio por consulta

    // Próximos agendamentos
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: { gte: now },
        status: 'SCHEDULED',
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        employee: { select: { name: true } },
        service: { select: { name: true } },
      },
    });

    return {
      totalAppointments,
      totalClients,
      totalEmployees,
      totalRevenue,
      appointmentsToday,
      appointmentsThisWeek,
      appointmentsThisMonth,
      recentActivity: recentAppointments,
      upcomingAppointments,
    };
  }

  async getMonthlyAnalytics(
    clientId: string,
    userRole: string,
    month?: string,
    year?: string,
  ): Promise<MonthlyAnalytics> {
    this.logger.log(`📈 [DashboardService] Obtendo analytics mensais para cliente: ${clientId}`);

    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    // Dados simplificados para evitar erros de groupBy complexos
    const monthlyAppointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        startTime: true,
        serviceId: true,
      },
    });

    // Simular dados agregados
    const appointmentsByDay = monthlyAppointments.reduce((acc: any[], apt) => {
      const date = apt.startTime.toISOString().split('T')[0];
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, []);

    const servicePopularity = monthlyAppointments
      .reduce((acc: any[], apt) => {
        const existing = acc.find((item) => item.serviceId === apt.serviceId);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ serviceId: apt.serviceId, count: 1 });
        }
        return acc;
      }, [])
      .slice(0, 10);

    // Crescimento de clientes (simplificado)
    const clientsGrowth = await this.prisma.user.findMany({
      where: {
        clientId,
        role: 'CLIENT',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        createdAt: true,
      },
    });

    return {
      appointmentsByDay,
      revenueByDay: appointmentsByDay.map((item) => ({
        date: item.date,
        revenue: item.count * 150, // Valor médio
      })),
      clientsGrowth: clientsGrowth.map((user) => ({
        date: user.createdAt.toISOString().split('T')[0],
        count: 1,
      })),
      servicePopularity,
    };
  }

  async getPersonalAnalytics(
    clientId: string,
    userId: string,
    userRole: string,
  ): Promise<PersonalAnalytics> {
    this.logger.log(`👤 [DashboardService] Obtendo analytics pessoais para usuário: ${userId}`);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let whereCondition: any = { clientId };

    // Ajustar condição baseado no role
    if (userRole === 'EMPLOYEE') {
      const employee = await this.prisma.employee.findFirst({
        where: { userId, clientId },
      });

      if (employee) {
        whereCondition.employeeId = employee.id;
      }
    } else if (userRole === 'CLIENT' || userRole === 'PATIENT') {
      whereCondition.userId = userId;
    }

    const [
      myAppointmentsToday,
      myAppointmentsThisWeek,
      myAppointmentsThisMonth,
      recentAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          ...whereCondition,
          startTime: { gte: startOfDay },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...whereCondition,
          startTime: { gte: startOfWeek },
        },
      }),
      this.prisma.appointment.count({
        where: {
          ...whereCondition,
          startTime: { gte: startOfMonth },
        },
      }),
      this.prisma.appointment.findMany({
        where: whereCondition,
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          employee: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    // Calcular outros dados pessoais
    let myClients = 0;
    let myRevenue = 0;

    if (userRole === 'EMPLOYEE') {
      myClients = await this.prisma.appointment
        .groupBy({
          by: ['userId'],
          where: whereCondition,
          _count: { userId: true },
        })
        .then((results) => results.length);
    }

    myRevenue = myAppointmentsThisMonth * 150; // Valor médio

    return {
      myAppointmentsToday,
      myAppointmentsThisWeek,
      myAppointmentsThisMonth,
      myClients,
      myRevenue,
      recentAppointments,
    };
  }
}
