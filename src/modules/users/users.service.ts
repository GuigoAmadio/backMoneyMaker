import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/tenant/tenant.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private configService: ConfigService,
  ) {}

  /**
   * Criar novo usuário
   */
  async create(createUserDto: CreateUserDto, clientId: string) {
    // Verificar se email já existe para este cliente
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
        clientId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await this.hashPassword(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        clientId,
      },
      select: this.getUserSelectFields(),
    });

    return user;
  }

  /**
   * Buscar todos os usuários com paginação
   */
  async findAll(clientId: string, paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { page, limit, orderBy, orderDirection } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause = this.tenantService.applyTenantFilter(clientId);

    const findManyArgs: any = {
      where: whereClause,
      select: this.getUserSelectFields(),
      orderBy: {
        [orderBy || 'createdAt']: orderDirection,
      },
    };
    if (typeof skip === 'number' && !isNaN(skip)) findManyArgs.skip = skip;
    if (typeof limit === 'number' && !isNaN(limit)) findManyArgs.take = limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany(findManyArgs),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
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
   * Buscar usuário por ID
   */
  async findOne(id: string, clientId: string) {
    const user = await this.prisma.user.findFirst({
      where: this.tenantService.applyTenantFilter(clientId, { id }),
      select: this.getUserSelectFields(),
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Atualizar usuário
   */
  async update(id: string, updateUserDto: UpdateUserDto, clientId: string) {
    // Verificar se usuário existe
    await this.findOne(id, clientId);

    // Se email está sendo alterado, verificar se não existe outro usuário com o mesmo email
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          clientId,
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso por outro usuário');
      }
    }

    // Se senha está sendo alterada, fazer hash
    const updateData = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData as any,
      select: this.getUserSelectFields(),
    });

    return user;
  }

  /**
   * Remover usuário
   */
  async remove(id: string, clientId: string) {
    // Verificar se usuário existe
    await this.findOne(id, clientId);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Buscar usuário por email
   */
  async findByEmail(email: string, clientId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        ...(clientId && { clientId }),
      },
      select: {
        ...this.getUserSelectFields(),
        password: true, // Incluir senha para autenticação
      },
    });
  }

  /**
   * Atualizar status do usuário
   */
  async updateStatus(id: string, status: string, clientId: string) {
    await this.findOne(id, clientId);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: this.getUserSelectFields(),
    });

    return user;
  }

  /**
   * Hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS')) || 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Campos a serem selecionados (sem senha)
   */
  private getUserSelectFields() {
    return {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    };
  }

  /**
   * Obter estatísticas do dashboard
   */
  async getDashboardStats(clientId: string) {
    const whereClause = this.tenantService.applyTenantFilter(clientId);

    const [totalUsers, activeUsers, newUsersThisMonth, usersByRole] = await Promise.all([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.count({
        where: {
          ...whereClause,
          status: 'ACTIVE',
        },
      }),
      this.prisma.user.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: whereClause,
        _count: {
          role: true,
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
