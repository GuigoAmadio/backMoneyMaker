import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Criar novo cliente
   */
  async create(createClientDto: CreateClientDto) {
    // Verificar se slug ou email já existem
    const existingClient = await this.prisma.client.findFirst({
      where: {
        OR: [{ slug: createClientDto.slug }, { email: createClientDto.email }],
      },
    });

    if (existingClient) {
      if (existingClient.slug === createClientDto.slug) {
        throw new ConflictException('Slug já está em uso');
      }
      if (existingClient.email === createClientDto.email) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const client = await this.prisma.client.create({
      data: createClientDto,
    });

    return client;
  }

  /**
   * Buscar todos os clientes (apenas SUPER_ADMIN)
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { page, limit, orderBy, orderDirection } = paginationDto;
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip,
        take: limit,
        orderBy: {
          [orderBy || 'createdAt']: orderDirection,
        },
      }),
      this.prisma.client.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: clients,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Buscar cliente por ID
   */
  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            appointments: true,
            orders: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  /**
   * Atualizar cliente
   */
  async update(id: string, updateClientDto: UpdateClientDto) {
    // Verificar se cliente existe
    await this.findOne(id);

    // Verificar se slug ou email já existem (se estão sendo alterados)
    if (updateClientDto.slug || updateClientDto.email) {
      const existingClient = await this.prisma.client.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updateClientDto.slug ? [{ slug: updateClientDto.slug }] : []),
                ...(updateClientDto.email ? [{ email: updateClientDto.email }] : []),
              ],
            },
          ],
        },
      });

      if (existingClient) {
        if (existingClient.slug === updateClientDto.slug) {
          throw new ConflictException('Slug já está em uso');
        }
        if (existingClient.email === updateClientDto.email) {
          throw new ConflictException('Email já está em uso');
        }
      }
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });

    return client;
  }

  /**
   * Remover cliente
   */
  async remove(id: string) {
    // Verificar se cliente existe
    await this.findOne(id);

    await this.prisma.client.delete({
      where: { id },
    });
  }

  /**
   * Buscar cliente por slug
   */
  async findBySlug(slug: string) {
    return this.prisma.client.findUnique({
      where: { slug },
    });
  }

  /**
   * Atualizar status do cliente
   */
  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    const client = await this.prisma.client.update({
      where: { id },
      data: { status: status as any },
    });

    return client;
  }
}
