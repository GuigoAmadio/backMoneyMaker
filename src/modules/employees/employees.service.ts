import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, clientId: string) {
    // Verificar se o email já está em uso neste cliente
    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        email: createEmployeeDto.email,
        clientId,
      },
    });

    if (existingEmployee) {
      throw new ConflictException('Email já está em uso por outro funcionário');
    }

    const employee = await this.prisma.employee.create({
      data: {
        ...createEmployeeDto,
        clientId,
        workingHours: createEmployeeDto.workingHours || {},
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        services: {
          select: { id: true, name: true, duration: true, price: true },
        },
        appointments: {
          select: { id: true, startTime: true, endTime: true, status: true },
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 5,
        },
      },
    });

    return {
      success: true,
      message: 'Funcionário criado com sucesso',
      data: employee,
    };
  }

  async findAll(
    clientId: string,
    paginationDto: PaginationDto,
    search?: string,
    status?: string,
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = Number(page) && Number(limit) ? (Number(page) - 1) * Number(limit) : 0;
    const take = Number(limit) || 10;

    const where: any = { clientId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          services: {
            select: { id: true, name: true, duration: true, price: true },
          },
          appointments: {
            select: { id: true, startTime: true, endTime: true, status: true },
            where: { startTime: { gte: new Date() } },
            orderBy: { startTime: 'asc' },
            take: 3,
          },
          _count: {
            select: {
              services: true,
              appointments: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string, clientId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, clientId },
      include: {
        client: {
          select: { id: true, name: true },
        },
        services: {
          select: { id: true, name: true, duration: true, price: true, isActive: true },
        },
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            service: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
        _count: {
          select: {
            services: true,
            appointments: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return {
      success: true,
      data: employee,
    };
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, clientId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, clientId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verificar se o email já está em uso por outro funcionário
    if (updateEmployeeDto.email) {
      const existingEmployee = await this.prisma.employee.findFirst({
        where: {
          email: updateEmployeeDto.email,
          clientId,
          NOT: { id },
        },
      });

      if (existingEmployee) {
        throw new ConflictException('Email já está em uso por outro funcionário');
      }
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: {
        client: {
          select: { id: true, name: true },
        },
        services: {
          select: { id: true, name: true, duration: true, price: true },
        },
      },
    });

    return {
      success: true,
      message: 'Funcionário atualizado com sucesso',
      data: updatedEmployee,
    };
  }

  async remove(id: string, clientId: string) {
    const employee = await this.prisma.employee.findFirst({
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

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verificar se há agendamentos futuros
    if (employee._count.appointments > 0) {
      throw new BadRequestException(
        'Não é possível remover funcionário com agendamentos futuros. Desative o funcionário ao invés de removê-lo.',
      );
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Funcionário removido com sucesso',
    };
  }

  async updateStatus(id: string, isActive: boolean, clientId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, clientId },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: { isActive },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      success: true,
      message: `Funcionário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: updatedEmployee,
    };
  }

  async getServicesByEmployee(employeeId: string, clientId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId, clientId },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isActive: true,
          },
        },
      },
    });
    if (!employee) {
      return { success: false, message: 'Funcionário não encontrado', services: [] };
    }
    return { success: true, services: employee.services };
  }

  /**
   * Obter estatísticas de funcionários
   */
  async getEmployeeStats(clientId: string) {
    this.logger.log(`Obtendo estatísticas de funcionários para clientId: ${clientId}`);

    try {
      // Tentar obter do cache primeiro
      const cacheKey = `employees:stats:${clientId}`;
      const cachedStats = await this.cacheService.get(cacheKey);

      if (cachedStats) {
        this.logger.debug(
          `Estatísticas de funcionários obtidas do cache para clientId: ${clientId}`,
        );
        return cachedStats;
      }

      this.logger.log(`Cache miss - coletando estatísticas do banco para clientId: ${clientId}`);

      const [totalEmployees, activeEmployees, inactiveEmployees, employeesByPosition, recentHires] =
        await Promise.all([
          this.prisma.employee.count({ where: { clientId } }),
          this.prisma.employee.count({ where: { clientId, isActive: true } }),
          this.prisma.employee.count({ where: { clientId, isActive: false } }),
          this.prisma.employee.groupBy({
            by: ['position'],
            where: { clientId },
            _count: { position: true },
          }),
          this.prisma.employee.count({
            where: {
              clientId,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
              },
            },
          }),
        ]);

      this.logger.log(`Estatísticas calculadas para clientId: ${clientId}`);

      const result = {
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          employeesByPosition: employeesByPosition.map((item) => ({
            position: item.position,
            count: item._count.position,
          })),
          recentHires,
        },
      };

      // Salvar no cache por 10 minutos
      await this.cacheService.set(cacheKey, result, clientId, {
        ttl: 600,
        tags: ['employees', 'stats'],
      });

      this.logger.log(
        `Estatísticas de funcionários coletadas e cacheadas com sucesso para clientId: ${clientId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas de funcionários para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }
}
