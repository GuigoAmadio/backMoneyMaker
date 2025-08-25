import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ServiceFilters {
  category?: string;
  active?: boolean;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalBookings: number;
  totalRevenue: number;
  mostPopular: any[];
  categoriesCount: any[];
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private prisma: PrismaService) {}

  async getAllServices(clientId: string, filters: ServiceFilters): Promise<any[]> {
    this.logger.log(`📋 [ServicesService] Obtendo todos os serviços para cliente: ${clientId}`);

    const where: any = { clientId };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.active !== undefined) {
      where.isActive = filters.active;
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return services;
  }

  async getAvailableServices(clientId: string, employeeId?: string, date?: string): Promise<any[]> {
    this.logger.log(`🛍️ [ServicesService] Obtendo serviços disponíveis para cliente: ${clientId}`);

    const where: any = {
      clientId,
      isActive: true,
    };

    // Se um funcionário específico foi fornecido, filtrar pelos serviços que ele oferece
    if (employeeId) {
      where.employees = {
        some: {
          id: employeeId,
        },
      };
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return services;
  }

  async getServiceCategories(clientId: string): Promise<any[]> {
    this.logger.log(
      `📂 [ServicesService] Obtendo categorias de serviços para cliente: ${clientId}`,
    );

    // Simplificar para evitar problemas de groupBy
    const services = await this.prisma.service.findMany({
      where: {
        clientId,
        isActive: true,
        categoryId: {
          not: null,
        },
      },
      select: {
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Agrupar manualmente
    const categoryMap = new Map();
    services.forEach((service) => {
      if (service.category?.name) {
        const categoryName = service.category.name;
        const count = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, count + 1);
      }
    });

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }

  async getPopularServices(clientId: string, limit: number): Promise<any[]> {
    this.logger.log(`⭐ [ServicesService] Obtendo serviços populares para cliente: ${clientId}`);

    const services = await this.prisma.service.findMany({
      where: {
        clientId,
        isActive: true,
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
      take: limit,
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return services;
  }

  async getServiceStats(clientId: string): Promise<ServiceStats> {
    this.logger.log(
      `📊 [ServicesService] Obtendo estatísticas de serviços para cliente: ${clientId}`,
    );

    const [
      totalServices,
      activeServices,
      inactiveServices,
      totalBookings,
      mostPopular,
      categoriesData,
    ] = await Promise.all([
      this.prisma.service.count({ where: { clientId } }),
      this.prisma.service.count({ where: { clientId, isActive: true } }),
      this.prisma.service.count({ where: { clientId, isActive: false } }),
      this.prisma.appointment.count({
        where: {
          clientId,
          service: {
            clientId,
          },
        },
      }),
      this.prisma.service.findMany({
        where: { clientId, isActive: true },
        orderBy: {
          appointments: {
            _count: 'desc',
          },
        },
        take: 5,
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      }),
      // Substituir groupBy por consulta simples
      this.prisma.service.findMany({
        where: {
          clientId,
          categoryId: {
            not: null,
          },
        },
        select: {
          categoryId: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Contar categorias manualmente
    const categoryMap = new Map();
    categoriesData.forEach((service) => {
      if (service.category?.name) {
        const categoryName = service.category.name;
        const count = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, count + 1);
      }
    });
    const categoriesCount = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    // Calcular receita total (estimativa)
    const totalRevenue = totalBookings * 150; // Valor médio por serviço

    return {
      totalServices,
      activeServices,
      inactiveServices,
      totalBookings,
      totalRevenue,
      mostPopular,
      categoriesCount,
    };
  }

  async getServiceById(clientId: string, serviceId: string): Promise<any> {
    this.logger.log(`🔍 [ServicesService] Obtendo serviço ${serviceId} para cliente: ${clientId}`);

    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        clientId,
      },
      include: {
        employees: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
        appointments: {
          take: 10,
          orderBy: { startTime: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            employees: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    return service;
  }

  async createService(clientId: string, serviceData: any): Promise<any> {
    this.logger.log(`➕ [ServicesService] Criando serviço para cliente: ${clientId}`);

    const service = await this.prisma.service.create({
      data: {
        ...serviceData,
        clientId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            appointments: true,
            employees: true,
          },
        },
      },
    });

    this.logger.log(`✅ [ServicesService] Serviço criado com sucesso: ${service.id}`);
    return service;
  }

  async updateService(clientId: string, serviceId: string, updateData: any): Promise<any> {
    this.logger.log(
      `✏️ [ServicesService] Atualizando serviço ${serviceId} para cliente: ${clientId}`,
    );

    // Verificar se o serviço existe e pertence ao cliente
    const existingService = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        clientId,
      },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            appointments: true,
            employees: true,
          },
        },
      },
    });

    this.logger.log(`✅ [ServicesService] Serviço atualizado com sucesso: ${serviceId}`);
    return service;
  }

  async deleteService(clientId: string, serviceId: string): Promise<void> {
    this.logger.log(
      `🗑️ [ServicesService] Deletando serviço ${serviceId} para cliente: ${clientId}`,
    );

    // Verificar se o serviço existe e pertence ao cliente
    const existingService = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        clientId,
      },
    });

    if (!existingService) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se há agendamentos ativos para este serviço
    const activeAppointments = await this.prisma.appointment.count({
      where: {
        serviceId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
    });

    if (activeAppointments > 0) {
      throw new Error('Não é possível deletar serviço com agendamentos ativos');
    }

    await this.prisma.service.delete({
      where: { id: serviceId },
    });

    this.logger.log(`✅ [ServicesService] Serviço deletado com sucesso: ${serviceId}`);
  }
}
