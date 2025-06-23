import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto, clientId: string) {
    // Verificar se o nome já está em uso neste cliente
    const existingService = await this.prisma.service.findFirst({
      where: {
        name: createServiceDto.name,
        clientId,
      },
    });

    if (existingService) {
      throw new ConflictException('Nome do serviço já está em uso');
    }

    // Validar regra de negócio: antecedência mínima não pode ser maior que máxima
    if (
      createServiceDto.minAdvanceBooking &&
      createServiceDto.maxAdvanceBooking &&
      createServiceDto.minAdvanceBooking > createServiceDto.maxAdvanceBooking
    ) {
      throw new BadRequestException(
        'Antecedência mínima não pode ser maior que a antecedência máxima',
      );
    }

    const service = await this.prisma.service.create({
      data: {
        ...createServiceDto,
        clientId,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
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

    return {
      success: true,
      message: 'Serviço criado com sucesso',
      data: service,
    };
  }

  async findAll(
    clientId: string,
    paginationDto: PaginationDto,
    search?: string,
    status?: string,
  ): Promise<PaginatedResult<any>> {
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

    const totalPages = Math.ceil(total / limit);

    return {
      data: services,
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
    const service = await this.prisma.service.findFirst({
      where: { id, clientId },
      include: {
        client: {
          select: { id: true, name: true },
        },
        employees: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            isActive: true,
            workingHours: true,
          },
        },
        appointments: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            employee: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
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
      throw new NotFoundException('Serviço não encontrado');
    }

    return {
      success: true,
      data: service,
    };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, clientId: string) {
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
          name: updateServiceDto.name,
          clientId,
          NOT: { id },
        },
      });

      if (existingService) {
        throw new ConflictException('Nome do serviço já está em uso');
      }
    }

    // Validar regra de negócio: antecedência mínima não pode ser maior que máxima
    const minAdvance = updateServiceDto.minAdvanceBooking ?? service.minAdvanceBooking;
    const maxAdvance = updateServiceDto.maxAdvanceBooking ?? service.maxAdvanceBooking;

    if (minAdvance && maxAdvance && minAdvance > maxAdvance) {
      throw new BadRequestException(
        'Antecedência mínima não pode ser maior que a antecedência máxima',
      );
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        client: {
          select: { id: true, name: true },
        },
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

  async remove(id: string, clientId: string) {
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

  async updateStatus(id: string, isActive: boolean, clientId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, clientId },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const updatedService = await this.prisma.service.update({
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
      message: `Serviço ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: updatedService,
    };
  }
}
