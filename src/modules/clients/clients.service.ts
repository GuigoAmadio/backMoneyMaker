import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { Logger } from '@nestjs/common';
import { TelegramService } from '../../common/notifications/telegram.service';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  /**
   * Criar novo cliente
   */
  async create(createClientDto: CreateClientDto, clientId: string) {
    this.logger.log(`Service: Criando usuário para clientId: ${clientId}`);

    try {
      // Criar um usuário (cliente) dentro do tenant atual
      const user = await this.prisma.user.create({
        data: {
          name: createClientDto.name,
          email: createClientDto.email,
          phone: createClientDto.phone,
          status: createClientDto.status || 'ACTIVE',
          role: 'CLIENT',
          password: 'temporary_password_123', // Senha temporária
          client: {
            connect: {
              id: clientId,
            },
          },
        },
      });

      this.logger.log(`Service: Usuário criado com ID: ${user.id}`);

      // Notificar criação de cliente
      await this.telegramService.sendCustomAlert(
        'success',
        '👤 NOVO CLIENTE CRIADO',
        `Novo cliente criado: ${user.name} (${user.email})`,
        {
          userId: user.id,
          clientId,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          timestamp: new Date(),
        },
      );

      return {
        success: true,
        data: {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Service: Erro ao criar cliente: ${error.message}`);

      await this.telegramService.sendCustomAlert(
        'error',
        '🚨 ERRO AO CRIAR CLIENTE',
        `Erro crítico ao criar cliente: ${error.message}`,
        {
          clientId,
          createClientDto,
          error: error.stack,
          timestamp: new Date(),
        },
      );

      throw error;
    }
  }

  /**
   * Obter quantidade total de clientes
   */
  async getClientsCount(clientId: string) {
    this.logger.log(`Service: Obtendo quantidade de clientes para clientId: ${clientId}`);

    try {
      const count = await this.prisma.user.count({
        where: {
          clientId,
          role: 'CLIENT',
        },
      });

      this.logger.log(`Service: Quantidade de clientes encontrada: ${count}`);

      return {
        success: true,
        data: {
          count,
        },
      };
    } catch (error) {
      this.logger.error(
        `Service: Erro ao obter quantidade de clientes para clientId: ${clientId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Buscar todos os clientes (apenas SUPER_ADMIN)
   */
  async findAll(query: GetClientsDto, clientId: string) {
    this.logger.log(
      `Service: Buscando clientes com query: ${JSON.stringify(query)}, clientId: ${clientId}`,
    );

    try {
      // Converter strings para numbers com validação
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;
      const search = query.search;
      const status = query.status;

      const where: any = {
        clientId,
        role: 'CLIENT',
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      }

      // Se limit não for fornecido, retornar todos (sem paginação)
      if (!limit) {
        const users = await this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        this.logger.log(`Service: Encontrados ${users.length} clientes (sem paginação)`);

        return {
          success: true,
          data: {
            data: users,
            meta: {
              page: 1,
              limit: users.length,
              totalItems: users.length,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false,
            },
          },
          message: 'Clientes encontrados com sucesso',
        };
      }

      // Com paginação
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(1, limit), 100);
      const skip = (validatedPage - 1) * validatedLimit;

      const [users, totalItems] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / validatedLimit);
      const hasNext = validatedPage < totalPages;
      const hasPrevious = validatedPage > 1;

      this.logger.log(`Service: Encontrados ${users.length} clientes de ${totalItems} total`);

      return {
        success: true,
        data: {
          data: users,
          meta: {
            page: validatedPage,
            limit: validatedLimit,
            totalItems,
            totalPages,
            hasNext,
            hasPrevious,
          },
        },
        message: 'Clientes encontrados com sucesso',
      };
    } catch (error) {
      this.logger.error(`Service: Erro ao buscar clientes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar cliente por ID
   */
  async findOne(id: string, clientId: string) {
    this.logger.log(`Service: Buscando usuário ${id} para clientId: ${clientId}`);

    const user = await this.prisma.user.findFirst({
      where: { id, clientId, role: 'CLIENT' },
    });

    this.logger.log(`Service: Usuário encontrado:`, user);

    if (!user) {
      this.logger.log(`Service: Usuário não encontrado`);
      throw new NotFoundException('Usuário não encontrado');
    }

    const result = {
      success: true,
      data: {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    };

    this.logger.log(`Service: Retornando resultado:`, result);
    return result;
  }

  /**
   * Atualizar cliente
   */
  async update(id: string, updateClientDto: UpdateClientDto, clientId: string) {
    this.logger.log(`Service: Atualizando usuário ${id} para clientId: ${clientId}`);

    try {
      const user = await this.prisma.user.update({
        where: { id, clientId },
        data: {
          name: updateClientDto.name,
          email: updateClientDto.email,
          phone: updateClientDto.phone,
          status: updateClientDto.status,
        },
      });

      this.logger.log(`Service: Usuário atualizado: ${user.id}`);

      // Notificar atualização de cliente
      await this.telegramService.sendCustomAlert(
        'info',
        '📝 CLIENTE ATUALIZADO',
        `Cliente atualizado: ${user.name} (${user.email})`,
        {
          userId: user.id,
          clientId,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          status: user.status,
          timestamp: new Date(),
        },
      );

      return {
        success: true,
        data: {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error(`Service: Erro ao atualizar cliente: ${error.message}`);

      await this.telegramService.sendCustomAlert(
        'error',
        '🚨 ERRO AO ATUALIZAR CLIENTE',
        `Erro crítico ao atualizar cliente: ${error.message}`,
        {
          userId: id,
          clientId,
          updateClientDto,
          error: error.stack,
          timestamp: new Date(),
        },
      );

      throw error;
    }
  }

  /**
   * Remover cliente
   */
  async remove(id: string, clientId: string) {
    this.logger.log(`Service: Removendo cliente ${id} para clientId: ${clientId}`);

    try {
      // Verificar se cliente existe
      const existingClient = await this.findOne(id, clientId);
      const clientData = existingClient.data.data;

      // Usar transação para garantir consistência
      await this.prisma.$transaction(async (tx) => {
        // 1. Deletar appointments
        await tx.appointment.deleteMany({
          where: {
            userId: id,
            clientId: clientId,
          },
        });

        // 2. Deletar orders
        await tx.order.deleteMany({
          where: {
            userId: id,
            clientId: clientId,
          },
        });

        // 3. Deletar stock movements
        await tx.stockMovement.deleteMany({
          where: {
            userId: id,
            clientId: clientId,
          },
        });

        // 4. Deletar refresh tokens
        await tx.refreshToken.deleteMany({
          where: {
            userId: id,
          },
        });

        // 5. Deletar audit logs
        await tx.auditLog.deleteMany({
          where: {
            userId: id,
            clientId: clientId,
          },
        });

        // Por último, deletar o usuário
        await tx.user.delete({
          where: { id, clientId },
        });
      });

      this.logger.log(`Service: Cliente removido: ${id}`);

      // Notificar remoção de cliente
      await this.telegramService.sendCustomAlert(
        'warning',
        '🗑️ CLIENTE REMOVIDO',
        `Cliente removido: ${clientData.name} (${clientData.email})`,
        {
          userId: id,
          clientId,
          userName: clientData.name,
          userEmail: clientData.email,
          userPhone: clientData.phone,
          timestamp: new Date(),
        },
      );

      return {
        success: true,
        message: 'Cliente removido com sucesso',
      };
    } catch (error) {
      this.logger.error(`Service: Erro ao remover cliente: ${error.message}`);

      await this.telegramService.sendCustomAlert(
        'error',
        '🚨 ERRO AO REMOVER CLIENTE',
        `Erro crítico ao remover cliente: ${error.message}`,
        {
          userId: id,
          clientId,
          error: error.stack,
          timestamp: new Date(),
        },
      );

      throw error;
    }
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
  async updateStatus(id: string, status: string, clientId: string) {
    await this.findOne(id, clientId);

    // Converter string para enum do Prisma
    const statusEnum = status.toUpperCase() as 'ACTIVE' | 'INACTIVE';

    const client = await this.prisma.user.update({
      where: {
        id,
        clientId,
        role: 'CLIENT',
      },
      data: { status: statusEnum },
    });

    return client;
  }

  /**
   * Buscar todos os usuários (clientes) que já tiveram appointment com um employee
   */
  async findClientsByEmployee(employeeId: string) {
    // Buscar todos os userIds distintos que têm appointment com esse employee
    const appointments = await this.prisma.appointment.findMany({
      where: { employeeId },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = appointments.map((a) => a.userId);

    if (userIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 1, hasNext: false, hasPrevious: false },
      };
    }

    // Buscar os usuários correspondentes
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    return {
      data: users,
      meta: {
        total: users.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
}
