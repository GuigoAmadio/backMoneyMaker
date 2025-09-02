import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { cleanData } from '../../common/utils/data-cleaner.util';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  GetSchedulesDto,
  ScheduleStatus,
  SchedulePriority,
  ScheduleCategory,
} from './dto';
import { CacheService } from '../../common/cache/cache.service';
import { TelegramService } from '../../common/notifications/telegram.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Criar nova agenda
   */
  async create(clientId: string, userId: string, data: CreateScheduleDto) {
    this.logger.log(
      `Criando agenda para clientId: ${clientId}, userId: ${userId}, data: ${data.date}`,
    );

    try {
      this.logger.debug(`Dados recebidos: ${JSON.stringify(data)}`);

      // Validar se usuário existe
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          clientId,
        },
        select: { id: true, name: true },
      });

      if (!user) {
        this.logger.error(`User não encontrado: ${userId} para clientId: ${clientId}`);
        throw new BadRequestException(`User com ID ${userId} não encontrado`);
      }

      // Validar employee se fornecido
      if (data.employeeId) {
        const employee = await this.prisma.employee.findFirst({
          where: {
            id: data.employeeId,
            clientId,
            isActive: true,
          },
          select: { id: true, name: true },
        });

        if (!employee) {
          this.logger.error(
            `Employee não encontrado: ${data.employeeId} para clientId: ${clientId}`,
          );
          throw new BadRequestException(
            `Employee com ID ${data.employeeId} não encontrado ou inativo`,
          );
        }
      }

      // Verificar se já existe agenda para o usuário nesta data
      const existingSchedule = await (this.prisma.schedule as any).findFirst({
        where: {
          clientId,
          userId,
          date: new Date(data.date),
        },
      });

      if (existingSchedule) {
        this.logger.warn(
          `Agenda já existe para clientId: ${clientId}, userId: ${userId}, data: ${data.date}`,
        );
        throw new ConflictException('Já existe uma agenda para este usuário nesta data');
      }

      const schedule = (await this.prisma.schedule.create({
        data: {
          clientId,
          userId,
          employeeId: data.employeeId || null,
          date: new Date(data.date),
          title: data.title,
          description: data.description || null,
          tasks: JSON.stringify(data.tasks || []) as any,
          status: data.status || ScheduleStatus.PENDING,
          priority: data.priority || SchedulePriority.MEDIUM,
          startTime: data.startTime ? new Date(data.startTime) : null,
          endTime: data.endTime ? new Date(data.endTime) : null,
          allDay: data.allDay || false,
          isRecurring: data.isRecurring || false,
          recurringPattern: data.recurringPattern || null,
          color: data.color || null,
          category: data.category || ScheduleCategory.WORK,
          reminders: JSON.stringify(data.reminders || []) as any,
          attachments: data.attachments || [],
          isPublic: data.isPublic || false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
      })) as any;

      this.logger.log(`Agenda criada com sucesso: ${schedule.id} para clientId: ${clientId}`);

      // Notificar criação de agenda
      await this.telegramService.sendCustomAlert(
        'success',
        '📅 NOVA AGENDA',
        `Nova agenda criada: ${schedule.title} - ${schedule.user?.name || 'Usuário'}`,
        {
          scheduleId: schedule.id,
          clientId,
          title: schedule.title,
          userName: schedule.user?.name,
          employeeName: schedule.employee?.name,
          date: schedule.date,
          priority: schedule.priority,
        },
      );

      // Limpar cache relacionado
      await this.clearScheduleCache(clientId, userId);

      return {
        success: true,
        data: {
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          date: schedule.date,
          status: schedule.status,
          priority: schedule.priority,
          category: schedule.category,
          tasks: schedule.tasks,
          user: schedule.user,
          employee: schedule.employee,
        },
        message: 'Agenda criada com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao criar agenda para clientId: ${clientId}`, error);

      if (!(error instanceof ConflictException || error instanceof BadRequestException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO CRIAR AGENDA',
          `Erro crítico ao criar agenda: ${error.message}`,
          {
            clientId,
            userId,
            data,
            error: error.stack,
          },
        );
      }

      throw error;
    }
  }

  /**
   * Listar agendas com filtros
   */
  async findAll(clientId: string, userId: string, filters: GetSchedulesDto) {
    this.logger.log(`Listando agendas para clientId: ${clientId}, userId: ${userId}`);

    try {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        date,
        status,
        priority,
        category,
        employeeId,
        publicOnly,
        search,
        sortBy = 'date',
        sortOrder = 'asc',
      } = filters;

      const where: any = {
        clientId,
      };

      // Se não for busca apenas pública, incluir agendas do usuário
      if (!publicOnly) {
        where.OR = [{ userId }, { isPublic: true }];
      } else {
        where.isPublic = true;
      }

      // Filtros de data
      if (date) {
        const searchDate = new Date(date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        where.date = {
          gte: searchDate,
          lt: nextDay,
        };
      } else if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      // Outros filtros
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (category) where.category = category;
      if (employeeId) where.employeeId = employeeId;

      // Busca por texto
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [schedules, total] = await Promise.all([
        (this.prisma.schedule as any).findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        (this.prisma.schedule as any).count({ where }),
      ]);

      this.logger.log(`Encontradas ${schedules.length} agendas para clientId: ${clientId}`);

      return {
        success: true,
        data: schedules.map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          date: schedule.date,
          status: schedule.status,
          priority: schedule.priority,
          category: schedule.category,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          allDay: schedule.allDay,
          isRecurring: schedule.isRecurring,
          color: schedule.color,
          isPublic: schedule.isPublic,
          tasks: schedule.tasks,
          reminders: schedule.reminders,
          attachments: schedule.attachments,
          completedAt: schedule.completedAt,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          user: schedule.user,
          employee: schedule.employee,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao listar agendas para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Buscar agenda por ID
   */
  async findOne(id: string, clientId: string, userId: string) {
    const schedule = await (this.prisma.schedule as any).findFirst({
      where: {
        id,
        clientId,
        OR: [{ userId }, { isPublic: true }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (!schedule) {
      throw new NotFoundException('Agenda não encontrada');
    }

    return {
      success: true,
      data: {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        status: schedule.status,
        priority: schedule.priority,
        category: schedule.category,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        allDay: schedule.allDay,
        isRecurring: schedule.isRecurring,
        recurringPattern: schedule.recurringPattern,
        color: schedule.color,
        isPublic: schedule.isPublic,
        tasks: schedule.tasks,
        reminders: schedule.reminders,
        attachments: schedule.attachments,
        completedAt: schedule.completedAt,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        user: schedule.user,
        employee: schedule.employee,
      },
    };
  }

  /**
   * Atualizar agenda
   */
  async update(id: string, clientId: string, userId: string, data: UpdateScheduleDto) {
    try {
      // Verificar se a agenda pertence ao usuário ou se ele tem permissão
      const existingSchedule = await (this.prisma.schedule as any).findFirst({
        where: {
          id,
          clientId,
          userId, // Apenas o próprio usuário pode editar
        },
      });

      if (!existingSchedule) {
        throw new NotFoundException(
          'Agenda não encontrada ou você não tem permissão para editá-la',
        );
      }

      const cleanedData = cleanData(data);

      // Converter datas se necessário
      if (cleanedData.date) {
        cleanedData.date = new Date(cleanedData.date);
      }
      if (cleanedData.startTime) {
        cleanedData.startTime = new Date(cleanedData.startTime);
      }
      if (cleanedData.endTime) {
        cleanedData.endTime = new Date(cleanedData.endTime);
      }
      if (cleanedData.completedAt) {
        cleanedData.completedAt = new Date(cleanedData.completedAt);
      }

      const schedule = await (this.prisma.schedule as any).update({
        where: { id },
        data: cleanedData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
      });

      // Notificar atualização
      await this.telegramService.sendCustomAlert(
        'info',
        '📝 AGENDA ATUALIZADA',
        `Agenda atualizada: ${schedule.title} - ${schedule.user?.name || 'Usuário'}`,
        {
          scheduleId: schedule.id,
          clientId,
          title: schedule.title,
          userName: schedule.user?.name,
          status: schedule.status,
          updatedFields: Object.keys(cleanedData),
        },
      );

      // Limpar cache
      await this.clearScheduleCache(clientId, userId);

      return {
        success: true,
        data: {
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          date: schedule.date,
          status: schedule.status,
          priority: schedule.priority,
          category: schedule.category,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          allDay: schedule.allDay,
          isRecurring: schedule.isRecurring,
          recurringPattern: schedule.recurringPattern,
          color: schedule.color,
          isPublic: schedule.isPublic,
          tasks: schedule.tasks,
          reminders: schedule.reminders,
          attachments: schedule.attachments,
          completedAt: schedule.completedAt,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          user: schedule.user,
          employee: schedule.employee,
        },
        message: 'Agenda atualizada com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO ATUALIZAR AGENDA',
          `Erro crítico ao atualizar agenda: ${error.message}`,
          { scheduleId: id, clientId, userId, error: error.stack },
        );
      }
      throw error;
    }
  }

  /**
   * Deletar agenda
   */
  async remove(id: string, clientId: string, userId: string) {
    try {
      const schedule = await (this.prisma.schedule as any).findFirst({
        where: {
          id,
          clientId,
          userId, // Apenas o próprio usuário pode deletar
        },
        include: {
          user: { select: { name: true } },
          employee: { select: { name: true } },
        },
      });

      if (!schedule) {
        throw new NotFoundException(
          'Agenda não encontrada ou você não tem permissão para deletá-la',
        );
      }

      await (this.prisma.schedule as any).delete({
        where: { id },
      });

      // Notificar exclusão
      await this.telegramService.sendCustomAlert(
        'warning',
        '🗑️ AGENDA DELETADA',
        `Agenda deletada: ${schedule.title} - ${schedule.user?.name || 'Usuário'}`,
        {
          scheduleId: id,
          clientId,
          title: schedule.title,
          userName: schedule.user?.name,
          date: schedule.date,
        },
      );

      // Limpar cache
      await this.clearScheduleCache(clientId, userId);

      return {
        success: true,
        message: 'Agenda deletada com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO DELETAR AGENDA',
          `Erro crítico ao deletar agenda: ${error.message}`,
          { scheduleId: id, clientId, userId, error: error.stack },
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar status da agenda
   */
  async updateStatus(id: string, clientId: string, userId: string, status: ScheduleStatus) {
    try {
      const schedule = await (this.prisma.schedule as any).findFirst({
        where: {
          id,
          clientId,
          userId,
        },
        include: {
          user: { select: { name: true } },
        },
      });

      if (!schedule) {
        throw new NotFoundException('Agenda não encontrada');
      }

      const updatedSchedule = await (this.prisma.schedule as any).update({
        where: { id },
        data: {
          status,
          completedAt: status === ScheduleStatus.COMPLETED ? new Date() : null,
        },
      });

      // Notificar mudança de status
      const statusEmoji = {
        PENDING: '⏳',
        IN_PROGRESS: '🔄',
        COMPLETED: '✅',
        CANCELLED: '❌',
        POSTPONED: '⏸️',
      };

      await this.telegramService.sendCustomAlert(
        'info',
        `${statusEmoji[status] || '📝'} STATUS DA AGENDA ATUALIZADO`,
        `Status da agenda alterado para: ${status}`,
        {
          scheduleId: id,
          clientId,
          title: schedule.title,
          userName: schedule.user?.name,
          oldStatus: schedule.status,
          newStatus: status,
          date: schedule.date,
        },
      );

      // Limpar cache
      await this.clearScheduleCache(clientId, userId);

      return {
        success: true,
        data: {
          id: updatedSchedule.id,
          status: updatedSchedule.status,
          completedAt: updatedSchedule.completedAt,
          updatedAt: updatedSchedule.updatedAt,
        },
        message: 'Status da agenda atualizado com sucesso',
      };
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.telegramService.sendCustomAlert(
          'error',
          '🚨 ERRO AO ATUALIZAR STATUS DA AGENDA',
          `Erro crítico ao atualizar status da agenda: ${error.message}`,
          { scheduleId: id, clientId, userId, status, error: error.stack },
        );
      }
      throw error;
    }
  }

  /**
   * Obter agendas de hoje
   */
  async getTodaySchedules(clientId: string, userId: string) {
    this.logger.log(`Obtendo agendas de hoje para clientId: ${clientId}, userId: ${userId}`);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const schedules = await (this.prisma.schedule as any).findMany({
        where: {
          clientId,
          OR: [{ userId }, { isPublic: true }],
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
        orderBy: { startTime: 'asc' },
      });

      this.logger.log(`Encontradas ${schedules.length} agendas de hoje para clientId: ${clientId}`);

      return {
        success: true,
        data: schedules.map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          date: schedule.date,
          status: schedule.status,
          priority: schedule.priority,
          category: schedule.category,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          allDay: schedule.allDay,
          color: schedule.color,
          tasks: schedule.tasks,
          user: schedule.user,
          employee: schedule.employee,
        })),
      };
    } catch (error) {
      this.logger.error(`Erro ao obter agendas de hoje para clientId: ${clientId}`, error);
      throw error;
    }
  }

  /**
   * Obter estatísticas das agendas
   */
  async getScheduleStats(clientId: string, userId: string) {
    this.logger.log(
      `Obtendo estatísticas das agendas para clientId: ${clientId}, userId: ${userId}`,
    );

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const baseWhere = {
        clientId,
        OR: [{ userId }, { isPublic: true }],
      };

      const [
        totalSchedules,
        todaySchedules,
        monthSchedules,
        completedSchedules,
        pendingSchedules,
        inProgressSchedules,
        highPrioritySchedules,
      ] = await Promise.all([
        (this.prisma.schedule as any).count({ where: baseWhere }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            status: ScheduleStatus.COMPLETED,
          },
        }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            status: ScheduleStatus.PENDING,
          },
        }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            status: ScheduleStatus.IN_PROGRESS,
          },
        }),
        (this.prisma.schedule as any).count({
          where: {
            ...baseWhere,
            priority: SchedulePriority.HIGH,
          },
        }),
      ]);

      return {
        success: true,
        data: {
          totalSchedules,
          todaySchedules,
          monthSchedules,
          statusBreakdown: {
            completed: completedSchedules,
            pending: pendingSchedules,
            inProgress: inProgressSchedules,
          },
          highPrioritySchedules,
          completionRate: totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas das agendas para clientId: ${clientId}`, error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  private async clearScheduleCache(clientId: string, userId: string) {
    try {
      const cacheKeys = [
        `schedules:${clientId}:${userId}`,
        `schedules:${clientId}:today`,
        `schedules:${clientId}:stats`,
      ];

      for (const key of cacheKeys) {
        await this.cacheService.delete(key);
      }
    } catch (error) {
      this.logger.warn('Erro ao limpar cache das agendas', error);
    }
  }
}
