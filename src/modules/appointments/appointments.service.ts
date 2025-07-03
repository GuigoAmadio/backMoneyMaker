import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obter agendamentos para o calendário
   */
  async getCalendarAppointments(
    clientId: string,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
  ) {
    const where: any = {
      clientId, // Filtrar por cliente
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    if (categoryId) {
      where.service = {
        categoryId,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        service: true,
        user: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return {
      success: true,
      data: appointments.map((appointment) => ({
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        service: {
          name: appointment.service?.name,
          price: Number(appointment.service?.price) || 0,
        },
        user: {
          name: appointment.user?.name,
          email: appointment.user?.email,
        },
        employee: {
          name: appointment.employee?.name,
          email: appointment.employee?.email,
        },
      })),
    };
  }

  /**
   * Obter agendamentos da semana
   */
  async getWeekAppointments(clientId: string, dateString?: string) {
    const referenceDate = dateString ? new Date(dateString) : new Date();

    // Encontrar o início da semana (segunda-feira)
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Encontrar o fim da semana (domingo)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return await this.getCalendarAppointments(
      clientId,
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0],
    );
  }

  /**
   * Obter agendamentos de hoje
   */
  async getTodayAppointments(clientId: string) {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const result = await this.getCalendarAppointments(clientId, todayString, todayString);

    return {
      success: true,
      data: {
        appointments: result.data,
        totalToday: result.data?.length || 0,
        revenue: result.data?.reduce((sum, apt) => sum + (apt.service?.price || 0), 0) || 0,
      },
    };
  }

  /**
   * Obter estatísticas de agendamentos
   */
  async getAppointmentStats(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todayCount, monthCount, todayRevenue, monthRevenue, totalCompleted, averageDuration] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            clientId,
            startTime: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.appointment.count({
          where: {
            clientId,
            startTime: { gte: startOfMonth },
          },
        }),
        this.calculateRevenue(clientId, today, tomorrow),
        this.calculateRevenue(clientId, startOfMonth, new Date()),
        this.prisma.appointment.count({
          where: {
            clientId,
            status: 'COMPLETED',
          },
        }),
        this.calculateAverageDuration(clientId),
      ]);

    return {
      success: true,
      data: {
        today: {
          count: todayCount,
          revenue: todayRevenue,
        },
        month: {
          count: monthCount,
          revenue: monthRevenue,
        },
        overall: {
          totalCompleted,
          averageDuration,
        },
      },
    };
  }

  /**
   * Obter categorias de agendamentos
   */
  async getCategories(clientId: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        clientId,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Criar categoria de agendamento
   */
  async createCategory(clientId: string, categoryData: any) {
    const category = await this.prisma.category.create({
      data: {
        ...categoryData,
        clientId,
        type: 'appointment',
      },
    });

    return {
      success: true,
      data: category,
      message: 'Categoria criada com sucesso',
    };
  }

  /**
   * Buscar slots disponíveis para agendamento
   */
  async getAvailableSlots(dateString: string, duration: number = 60) {
    const date = new Date(dateString);
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0); // Horário de início: 8h

    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0); // Horário de fim: 18h

    // Buscar agendamentos existentes do dia
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Gerar slots disponíveis
    const availableSlots = [];
    const slotDuration = duration; // em minutos

    for (
      let time = new Date(startOfDay);
      time < endOfDay;
      time.setMinutes(time.getMinutes() + slotDuration)
    ) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + slotDuration * 60 * 1000);

      // Verificar se o slot conflita com algum agendamento existente
      const hasConflict = existingAppointments.some((apt) => {
        return slotStart < apt.endTime && slotEnd > apt.startTime;
      });

      if (!hasConflict) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          time: slotStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    }

    return {
      success: true,
      data: availableSlots,
    };
  }

  /**
   * Listar agendamentos com filtros
   */
  async findAll(clientId: string, paginationDto: any, filters: any) {
    const { page = 1, limit = 10 } = paginationDto;
    const { status, serviceId, startDate, endDate, employeeId } = filters;

    const where: any = {
      clientId, // Filtrar por cliente
    };

    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              duration: true,
              price: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              position: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      success: true,
      data: appointments.map((apt) => ({
        ...apt,
        service: {
          ...apt.service,
          price: Number(apt.service?.price) || 0,
        },
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
   * Buscar agendamento por ID
   */
  async findOne(id: string, clientId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        clientId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return {
      success: true,
      data: {
        ...appointment,
        service: {
          ...appointment.service,
          price: Number(appointment.service?.price) || 0,
        },
      },
    };
  }

  /**
   * Criar agendamento
   */
  async create(data: any) {
    const appointment = await this.prisma.appointment.create({
      data,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...appointment,
        service: {
          ...appointment.service,
          price: Number(appointment.service?.price) || 0,
        },
      },
      message: 'Agendamento criado com sucesso',
    };
  }

  /**
   * Atualizar agendamento
   */
  async update(id: string, clientId: string, data: any) {
    // Verificar se o appointment pertence ao cliente
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: { id, clientId },
    });

    if (!existingAppointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...appointment,
        service: {
          ...appointment.service,
          price: Number(appointment.service?.price) || 0,
        },
      },
      message: 'Agendamento atualizado com sucesso',
    };
  }

  /**
   * Deletar agendamento
   */
  async remove(id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Agendamento deletado com sucesso',
    };
  }

  /**
   * Atualizar status do agendamento
   */
  async updateStatus(id: string, status: AppointmentStatus) {
    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      data: updatedAppointment,
      message: 'Status do agendamento atualizado com sucesso',
    };
  }

  /**
   * Criar múltiplos agendamentos
   */
  async createBulk(appointments: any[]) {
    const results = [];
    const errors = [];

    for (const appointmentData of appointments) {
      try {
        const result = await this.create(appointmentData);
        results.push(result.data);
      } catch (error) {
        errors.push({
          data: appointmentData,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      data: {
        created: results,
        errors,
        summary: {
          total: appointments.length,
          created: results.length,
          failed: errors.length,
        },
      },
    };
  }

  // Métodos auxiliares privados
  private async checkTimeConflict(
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = {
      OR: [
        {
          startTime: {
            lt: endTime,
          },
          endTime: {
            gt: startTime,
          },
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where,
    });

    return !!conflictingAppointment;
  }

  private async calculateRevenue(
    clientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        startTime: {
          gte: startDate,
          lt: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    });

    return appointments.reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);
  }

  private async calculateAverageDuration(clientId: string): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (appointments.length === 0) return 0;

    const totalMinutes = appointments.reduce((sum, apt) => {
      const duration = (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    return Math.round(totalMinutes / appointments.length);
  }
}
