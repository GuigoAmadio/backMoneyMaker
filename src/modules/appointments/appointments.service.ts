import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { cleanData } from '../../common/utils/data-cleaner.util';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CacheService } from '../../common/cache/cache.service';
import { TelegramService } from '../../common/notifications/telegram.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Obter quantidade de agendamentos com filtros opcionais
   */
  async getAppointmentsCount(
    clientId: string,
    startDate?: string,
    endDate?: string,
    status?: AppointmentStatus,
  ) {
    this.logger.log(
      `Obtendo quantidade de agendamentos para clientId: ${clientId}, startDate: ${startDate}, endDate: ${endDate}, status: ${status}`,
    );

    try {
      const where: any = {
        clientId, // Filtrar por cliente
      };

      if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = new Date(startDate);
        if (endDate) where.startTime.lte = new Date(endDate);
      }

      if (status) {
        where.status = status;
      }

      this.logger.debug(`Filtros aplicados: ${JSON.stringify(where)}`);

      const count = await this.prisma.appointment.count({ where });

      this.logger.log(`Quantidade de agendamentos encontrada: ${count} para clientId: ${clientId}`);

      return {
        success: true,
        data: {
          count,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter quantidade de agendamentos para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obter agendamentos para o calendário
   */
  async getCalendarAppointments(
    clientId: string,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
  ) {
    this.logger.log(
      `Obtendo agendamentos do calendário para clientId: ${clientId}, startDate: ${startDate}, endDate: ${endDate}, categoryId: ${categoryId}`,
    );

    try {
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

      this.logger.debug(`Filtros aplicados: ${JSON.stringify(where)}`);

      const appointments = await this.prisma.appointment.findMany({
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
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      this.logger.log(`Encontrados ${appointments.length} agendamentos para clientId: ${clientId}`);

      const result = {
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

      this.logger.log(
        `Agendamentos do calendário retornados com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao obter agendamentos do calendário para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Obter agendamentos da semana
   */
  async getWeekAppointments(clientId: string, dateString?: string) {
    this.logger.log(
      `Obtendo agendamentos da semana para clientId: ${clientId}, dateString: ${dateString}`,
    );

    try {
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

      this.logger.debug(
        `Período da semana: ${startOfWeek.toISOString()} até ${endOfWeek.toISOString()}`,
      );

      const result = await this.getCalendarAppointments(
        clientId,
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0],
      );

      this.logger.log(`Agendamentos da semana obtidos com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter agendamentos da semana para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Obter agendamentos de hoje
   */
  async getTodayAppointments(clientId: string) {
    this.logger.log(`Obtendo agendamentos de hoje para clientId: ${clientId}`);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      this.logger.debug(`Período de hoje: ${today.toISOString()} até ${tomorrow.toISOString()}`);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          clientId,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
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
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      this.logger.log(
        `Encontrados ${appointments.length} agendamentos de hoje para clientId: ${clientId}`,
      );

      const result = {
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

      this.logger.log(`Agendamentos de hoje retornados com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter agendamentos de hoje para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de agendamentos
   */
  async getAppointmentStats(clientId: string) {
    this.logger.log(`Obtendo estatísticas de agendamentos para clientId: ${clientId}`);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      this.logger.debug(
        `Período do mês: ${startOfMonth.toISOString()} até ${endOfMonth.toISOString()}`,
      );

      const [
        totalAppointments,
        todayAppointments,
        monthAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        totalRevenue,
        monthlyRevenue,
        averageDuration,
      ] = await Promise.all([
        this.prisma.appointment.count({ where: { clientId } }),
        this.prisma.appointment.count({
          where: {
            clientId,
            startTime: {
              gte: today,
            },
          },
        }),
        this.prisma.appointment.count({
          where: {
            clientId,
            startTime: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        this.prisma.appointment.count({
          where: {
            clientId,
            status: 'COMPLETED',
          },
        }),
        this.prisma.appointment.count({
          where: {
            clientId,
            status: 'CANCELLED',
          },
        }),
        this.prisma.appointment.count({
          where: {
            clientId,
            status: 'SCHEDULED',
          },
        }),
        this.calculateRevenue(clientId, new Date(0), new Date()),
        this.calculateRevenue(clientId, startOfMonth, endOfMonth),
        this.calculateAverageDuration(clientId),
      ]);

      this.logger.log(`Estatísticas calculadas para clientId: ${clientId}`);

      const result = {
        success: true,
        data: {
          totalAppointments,
          todayAppointments,
          monthAppointments,
          statusBreakdown: {
            completed: completedAppointments,
            cancelled: cancelledAppointments,
            pending: pendingAppointments,
          },
          revenue: {
            total: totalRevenue,
            monthly: monthlyRevenue,
          },
          averageDuration,
        },
      };

      this.logger.log(
        `Estatísticas de agendamentos retornadas com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas de agendamentos para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
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
    const { status, serviceId, startDate, endDate, employeeId, userId } = filters;

    const where: any = {
      clientId, // Filtrar por cliente
    };

    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (employeeId) where.employeeId = employeeId;
    if (userId) where.userId = userId;
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
        id: apt.id,
        clientId: apt.clientId,
        userId: apt.userId,
        employeeId: apt.employeeId,
        serviceId: apt.serviceId,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
        service: {
          ...apt.service,
          price: Number(apt.service?.price) || 0,
        },
        user: apt.user,
        employee: apt.employee,
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
        id: appointment.id,
        clientId: appointment.clientId,
        userId: appointment.userId,
        employeeId: appointment.employeeId,
        serviceId: appointment.serviceId,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        service: {
          ...appointment.service,
          price: Number(appointment.service?.price) || 0,
        },
        user: appointment.user,
        employee: appointment.employee,
      },
    };
  }

  /**
   * Criar agendamento
   */
  async create(data: CreateAppointmentDto) {
    this.logger.log(
      `Criando agendamento para clientId: ${data.clientId}, userId: ${data.userId}, serviceId: ${data.serviceId}`,
    );

    try {
      this.logger.debug(`Dados recebidos: ${JSON.stringify(data)}`);

      // Verificar conflito de horário
      const hasConflict = await this.checkTimeConflict(
        new Date(data.startTime),
        new Date(data.endTime),
      );

      if (hasConflict) {
        this.logger.warn(`Conflito de horário detectado para clientId: ${data.clientId}`);
        await this.telegramService.sendCustomAlert(
          'warning',
          '⚠️ CONFLITO DE HORÁRIO',
          `Tentativa de criar agendamento com conflito de horário`,
          {
            clientId: data.clientId,
            userId: data.userId,
            serviceId: data.serviceId,
            startTime: data.startTime,
            endTime: data.endTime,
          },
        );
        throw new ConflictException('Conflito de horário: já existe um agendamento neste período');
      }

      const appointment = await this.prisma.appointment.create({
        data: {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          status: data.status || 'SCHEDULED',
          clientId: data.clientId,
          userId: data.userId,
          serviceId: data.serviceId,
          employeeId: data.employeeId,
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

      this.logger.log(
        `Agendamento criado com sucesso: ${appointment.id} para clientId: ${data.clientId}`,
      );

      // Notificar criação de agendamento
      await this.telegramService.sendCustomAlert(
        'success',
        '📅 NOVO AGENDAMENTO',
        `Novo agendamento criado: ${appointment.service?.name || 'Serviço'} - ${appointment.user?.name || 'Cliente'}`,
        {
          appointmentId: appointment.id,
          clientId: data.clientId,
          serviceName: appointment.service?.name,
          userName: appointment.user?.name,
          employeeName: appointment.employee?.name,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        },
      );

      const result = {
        success: true,
        data: {
          id: appointment.id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
        },
        message: 'Agendamento criado com sucesso',
      };

      this.logger.log(`Agendamento retornado com sucesso para clientId: ${data.clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao criar agendamento para clientId: ${data.clientId}`, error);

      // Notificar erro crítico se não for ConflictException
      if (!(error instanceof ConflictException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO CRIAR AGENDAMENTO',
          `Erro crítico ao criar agendamento: ${error.message}`,
          {
            clientId: data.clientId,
            userId: data.userId,
            serviceId: data.serviceId,
            error: error.stack,
          },
        );
      }

      throw error;
    }
  }

  /**
   * Atualizar agendamento
   */
  async update(id: string, clientId: string, data: any) {
    try {
      // Verificar se o appointment pertence ao cliente
      const existingAppointment = await this.prisma.appointment.findFirst({
        where: { id, clientId },
      });

      if (!existingAppointment) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '⚠️ AGENDAMENTO NÃO ENCONTRADO',
          `Tentativa de atualizar agendamento inexistente: ${id}`,
          { appointmentId: id, clientId, timestamp: new Date() },
        );
        throw new NotFoundException('Agendamento não encontrado');
      }

      const cleanedData = cleanData(data);

      const appointment = await this.prisma.appointment.update({
        where: { id },
        data: cleanedData,
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

      // Notificar atualização de agendamento
      await this.telegramService.sendCustomAlert(
        'info',
        '📝 AGENDAMENTO ATUALIZADO',
        `Agendamento atualizado: ${appointment.service?.name || 'Serviço'} - ${appointment.user?.name || 'Cliente'}`,
        {
          appointmentId: appointment.id,
          clientId,
          serviceName: appointment.service?.name,
          userName: appointment.user?.name,
          employeeName: appointment.employee?.name,
          status: appointment.status,
          updatedFields: Object.keys(cleanedData),
        },
      );

      return {
        success: true,
        data: {
          id: appointment.id,
          clientId: appointment.clientId,
          userId: appointment.userId,
          employeeId: appointment.employeeId,
          serviceId: appointment.serviceId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          service: {
            ...appointment.service,
            price: Number(appointment.service?.price) || 0,
          },
          user: appointment.user,
          employee: appointment.employee,
        },
        message: 'Agendamento atualizado com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO ATUALIZAR AGENDAMENTO',
          `Erro crítico ao atualizar agendamento: ${error.message}`,
          { appointmentId: id, clientId, error: error.stack },
        );
      }
      throw error;
    }
  }

  /**
   * Deletar agendamento
   */
  async remove(id: string) {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id },
        include: {
          service: { select: { name: true } },
          user: { select: { name: true } },
          employee: { select: { name: true } },
        },
      });

      if (!appointment) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '⚠️ AGENDAMENTO NÃO ENCONTRADO',
          `Tentativa de deletar agendamento inexistente: ${id}`,
          { appointmentId: id, timestamp: new Date() },
        );
        throw new NotFoundException('Agendamento não encontrado');
      }

      await this.prisma.appointment.delete({
        where: { id },
      });

      // Notificar exclusão de agendamento
      await this.telegramService.sendCustomAlert(
        'warning',
        '🗑️ AGENDAMENTO DELETADO',
        `Agendamento deletado: ${appointment.service?.name || 'Serviço'} - ${appointment.user?.name || 'Cliente'}`,
        {
          appointmentId: id,
          clientId: appointment.clientId,
          serviceName: appointment.service?.name,
          userName: appointment.user?.name,
          employeeName: appointment.employee?.name,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        },
      );

      return {
        success: true,
        message: 'Agendamento deletado com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO DELETAR AGENDAMENTO',
          `Erro crítico ao deletar agendamento: ${error.message}`,
          { appointmentId: id, error: error.stack },
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar status do agendamento
   */
  async updateStatus(id: string, status: AppointmentStatus) {
    try {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id },
        include: {
          service: { select: { name: true } },
          user: { select: { name: true } },
          employee: { select: { name: true } },
        },
      });

      if (!appointment) {
        await this.telegramService.sendCustomAlert(
          'warning',
          '⚠️ AGENDAMENTO NÃO ENCONTRADO',
          `Tentativa de atualizar status de agendamento inexistente: ${id}`,
          { appointmentId: id, status, timestamp: new Date() },
        );
        throw new NotFoundException('Agendamento não encontrado');
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id },
        data: { status },
      });

      // Notificar mudança de status
      const statusEmoji = {
        SCHEDULED: '📅',
        CONFIRMED: '✅',
        IN_PROGRESS: '🔄',
        COMPLETED: '🎉',
        CANCELLED: '❌',
        NO_SHOW: '⏰',
      };

      await this.telegramService.sendCustomAlert(
        'info',
        `${statusEmoji[status] || '📝'} STATUS ATUALIZADO`,
        `Status do agendamento alterado para: ${status}`,
        {
          appointmentId: id,
          clientId: appointment.clientId,
          serviceName: appointment.service?.name,
          userName: appointment.user?.name,
          employeeName: appointment.employee?.name,
          oldStatus: appointment.status,
          newStatus: status,
          startTime: appointment.startTime,
        },
      );

      return {
        success: true,
        data: {
          id: updatedAppointment.id,
          clientId: updatedAppointment.clientId,
          userId: updatedAppointment.userId,
          employeeId: updatedAppointment.employeeId,
          serviceId: updatedAppointment.serviceId,
          startTime: updatedAppointment.startTime,
          endTime: updatedAppointment.endTime,
          status: updatedAppointment.status,
          createdAt: updatedAppointment.createdAt,
          updatedAt: updatedAppointment.updatedAt,
        },
        message: 'Status do agendamento atualizado com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO ATUALIZAR STATUS',
          `Erro crítico ao atualizar status do agendamento: ${error.message}`,
          { appointmentId: id, status, error: error.stack },
        );
      }
      throw error;
    }
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
