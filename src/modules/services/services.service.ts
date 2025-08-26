import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(clientId: string, createServiceDto: CreateServiceDto) {
    this.logger.log(`Criando serviço para clientId: ${clientId}, nome: ${createServiceDto.name}`);

    try {
      this.logger.debug(`Dados recebidos: ${JSON.stringify(createServiceDto)}`);

      // Verificar se o nome já está em uso
      const existingService = await this.prisma.service.findFirst({
        where: {
          clientId,
          name: createServiceDto.name,
        },
      });

      if (existingService) {
        this.logger.warn(
          `Nome de serviço já em uso: ${createServiceDto.name} para clientId: ${clientId}`,
        );
        throw new ConflictException('Nome do serviço já está em uso');
      }

      const service = await this.prisma.service.create({
        data: {
          ...createServiceDto,
          clientId,
        },
        include: {
          employees: {
            select: { id: true, name: true, email: true, position: true, isActive: true },
          },
          appointments: {
            select: { id: true, startTime: true, endTime: true, status: true },
            where: { startTime: { gte: new Date() } },
            orderBy: { startTime: 'asc' },
            take: 5,
          },
        },
      });

      this.logger.log(`Serviço criado com sucesso: ${service.id} para clientId: ${clientId}`);

      const result = {
        success: true,
        message: 'Serviço criado com sucesso',
        data: service,
      };

      this.logger.log(`Serviço retornado com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao criar serviço para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findAll(
    clientId: string,
    paginationDto: PaginationDto,
    search?: string,
    status?: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<PaginatedResult<any>> {
    this.logger.log(
      `Listando serviços para clientId: ${clientId}, search: ${search}, status: ${status}`,
    );

    try {
      this.logger.debug(`Pagination: ${JSON.stringify(paginationDto)}`);

      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const where: any = { clientId };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status !== undefined) {
        where.isActive = status === 'active';
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
          where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          where.price.lte = maxPrice;
        }
      }

      this.logger.debug(`Filtros aplicados: ${JSON.stringify(where)}`);

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            employees: {
              select: { id: true, name: true, email: true, position: true, isActive: true },
              where: { isActive: true },
            },
            appointments: {
              select: { id: true, startTime: true, endTime: true, status: true },
              where: { startTime: { gte: new Date() } },
              orderBy: { startTime: 'asc' },
              take: 3,
            },
            _count: {
              select: {
                employees: true,
                appointments: true,
              },
            },
          },
        }),
        this.prisma.service.count({ where }),
      ]);

      this.logger.log(
        `Encontrados ${services.length} serviços de ${total} total para clientId: ${clientId}`,
      );

      const result: PaginatedResult<any> = {
        data: services,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrevious: page > 1,
        },
      };

      this.logger.log(`Serviços retornados com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao listar serviços para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findOne(clientId: string, id: string) {
    this.logger.log(`Buscando serviço ${id} para clientId: ${clientId}`);

    try {
      const service = await this.prisma.service.findFirst({
        where: {
          id,
          clientId,
        },
        include: {
          employees: {
            select: { id: true, name: true, email: true, position: true, isActive: true },
          },
          appointments: {
            select: { id: true, startTime: true, endTime: true, status: true },
            where: { startTime: { gte: new Date() } },
            orderBy: { startTime: 'asc' },
            take: 10,
          },
          _count: {
            select: {
              employees: true,
              appointments: true,
            },
          },
        },
      });

      if (!service) {
        this.logger.warn(`Serviço não encontrado: ${id} para clientId: ${clientId}`);
        throw new NotFoundException('Serviço não encontrado');
      }

      this.logger.log(`Serviço encontrado: ${id} para clientId: ${clientId}`);

      const result = {
        success: true,
        data: service,
      };

      this.logger.log(`Serviço retornado com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao buscar serviço ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async update(clientId: string, id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id, clientId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se o nome já está em uso por outro serviço
    if (updateServiceDto.name) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          clientId,
          name: updateServiceDto.name,
          NOT: { id },
        },
      });

      if (existingService) {
        throw new ConflictException('Nome do serviço já está em uso');
      }
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        employees: {
          select: { id: true, name: true, email: true, position: true },
        },
      },
    });

    return {
      success: true,
      message: 'Serviço atualizado com sucesso',
      data: updatedService,
    };
  }

  async remove(clientId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, clientId },
      include: {
        _count: {
          select: {
            appointments: {
              where: { startTime: { gte: new Date() } },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    // Verificar se há agendamentos futuros
    if (service._count.appointments > 0) {
      throw new BadRequestException(
        'Não é possível remover serviço com agendamentos futuros. Desative o serviço ao invés de removê-lo.',
      );
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Serviço removido com sucesso',
    };
  }

  async updateStatus(clientId: string, id: string, isActive: boolean) {
    const service = await this.prisma.service.findFirst({
      where: { id, clientId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: { isActive },
    });

    return {
      success: true,
      message: `Serviço ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: updatedService,
    };
  }

  async getStats(clientId: string) {
    this.logger.log(`Obtendo estatísticas para clientId: ${clientId}`);

    try {
      const [totalServices, activeServices, totalAppointments, averagePrice, mostBookedService] =
        await Promise.all([
          // Total de serviços
          this.prisma.service.count({
            where: { clientId },
          }),

          // Serviços ativos
          this.prisma.service.count({
            where: { clientId, isActive: true },
          }),

          // Total de appointments completados
          this.prisma.appointment.count({
            where: {
              clientId,
              status: 'COMPLETED',
            },
          }),

          // Preço médio dos serviços
          this.prisma.service.aggregate({
            where: { clientId, isActive: true },
            _avg: {
              price: true,
            },
          }),

          // Serviço mais agendado
          this.prisma.service.findFirst({
            where: { clientId },
            include: {
              _count: {
                select: { appointments: true },
              },
            },
            orderBy: {
              appointments: {
                _count: 'desc',
              },
            },
          }),
        ]);

      // Calcular receita total baseada em appointments completados
      const revenueData = await this.prisma.appointment.findMany({
        where: {
          clientId,
          status: 'COMPLETED',
        },
        include: {
          service: {
            select: { price: true },
          },
        },
      });

      const totalRevenue = revenueData.reduce((sum, appointment) => {
        return sum + Number(appointment.service.price);
      }, 0);

      const stats = {
        totalServices,
        activeServices,
        inactiveServices: totalServices - activeServices,
        totalRevenue,
        averagePrice: Number(averagePrice._avg?.price) || 0,
        mostBookedService: mostBookedService?.name || 'N/A',
        totalAppointments,
      };

      return {
        success: true,
        data: stats,
        message: 'Estatísticas obtidas com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findPublic(
    clientId: string,
    paginationDto: PaginationDto,
    search?: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    this.logger.log(`Listando serviços públicos para clientId: ${clientId}`);

    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const where: any = {
        clientId,
        isActive: true, // Só serviços ativos são públicos
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) {
          where.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          where.price.lte = maxPrice;
        }
      }

      const [services, total] = await Promise.all([
        this.prisma.service.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: {
              select: { id: true, name: true, color: true },
            },
            _count: {
              select: {
                appointments: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: services,
          meta: {
            page,
            limit,
            totalItems: total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          },
        },
        message: 'Serviços públicos listados com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao listar serviços públicos para clientId: ${clientId}`, error);
      throw error;
    }
  }
}
