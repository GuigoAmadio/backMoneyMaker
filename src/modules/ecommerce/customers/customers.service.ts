import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../../../common/cache/cache.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private cacheService: CacheService,
  ) {}

  // Criar customer
  async create(createCustomerDto: any, clientId: string) {
    this.logger.log(`Criando cliente do ecommerce para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(createCustomerDto)}`);

    try {
      const { firstName, lastName, email, password } = createCustomerDto;

      // Verificar se já existe um customer com este email para este cliente
      const existingCustomer = await this.prisma.customer.findUnique({
        where: {
          clientId_email: {
            clientId,
            email,
          },
        },
      });

      if (existingCustomer) {
        this.logger.warn(`Email já em uso: ${email} para clientId: ${clientId}`);
        throw new ConflictException('Email já está em uso');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar customer
      const customer = await this.prisma.customer.create({
        data: {
          id: crypto.randomUUID(),
          clientId,
          firstName,
          lastName,
          email,
          password: hashedPassword,
          isActive: true,
          emailVerified: false,
        },
      });

      this.logger.log(`Cliente criado com sucesso: ${customer.id} para clientId: ${clientId}`);

      const result = {
        success: true,
        data: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          emailVerified: customer.emailVerified,
        },
        message: 'Cliente criado com sucesso',
      };

      this.logger.log(`Cliente retornado com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao criar cliente para clientId: ${clientId}`, error);
      throw error;
    }
  }

  // Atualizar customer
  async update(id: string, updateCustomerDto: any, clientId: string) {
    this.logger.log(`Atualizando cliente ${id} para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(updateCustomerDto)}`);

    try {
      // Verificar se o customer existe
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          id,
          clientId,
        },
      });

      if (!existingCustomer) {
        this.logger.warn(`Cliente não encontrado: ${id} para clientId: ${clientId}`);
        throw new NotFoundException('Cliente não encontrado');
      }

      // Se estiver atualizando o email, verificar se já existe
      if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
        const emailExists = await this.prisma.customer.findUnique({
          where: {
            clientId_email: {
              clientId,
              email: updateCustomerDto.email,
            },
          },
        });

        if (emailExists) {
          this.logger.warn(
            `Email já em uso: ${updateCustomerDto.email} para clientId: ${clientId}`,
          );
          throw new ConflictException('Email já está em uso');
        }
      }

      // Hash da senha se fornecida
      if (updateCustomerDto.password) {
        updateCustomerDto.password = await bcrypt.hash(updateCustomerDto.password, 10);
      }

      // Atualizar customer
      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateCustomerDto,
      });

      this.logger.log(`Cliente atualizado com sucesso: ${id} para clientId: ${clientId}`);

      const result = {
        success: true,
        data: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          emailVerified: customer.emailVerified,
        },
        message: 'Cliente atualizado com sucesso',
      };

      this.logger.log(`Cliente retornado com sucesso para clientId: ${clientId}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao atualizar cliente ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  // Remover customer
  async remove(id: string, clientId: string) {
    this.logger.log(`Deletando cliente ${id} para clientId: ${clientId}`);

    try {
      // Verificar se o customer existe
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          id,
          clientId,
        },
      });

      if (!existingCustomer) {
        this.logger.warn(`Cliente não encontrado: ${id} para clientId: ${clientId}`);
        throw new NotFoundException('Cliente não encontrado');
      }

      // Deletar customer
      await this.prisma.customer.delete({
        where: { id },
      });

      this.logger.log(`Cliente deletado com sucesso: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Cliente deletado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao deletar cliente ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  // Registro de novo customer
  async register(clientId: string, registerDto: any) {
    const { firstName, lastName, email, password } = registerDto;

    // Verificar se já existe um customer com este email para este cliente
    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        clientId_email: {
          clientId,
          email,
        },
      },
    });

    if (existingCustomer) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar customer
    const customer = await this.prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        clientId,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isActive: true,
        emailVerified: false,
      },
    });

    // Gerar tokens
    const tokens = await this.generateTokens(customer.id, customer.email);

    return {
      ...tokens,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        emailVerified: customer.emailVerified,
      },
    };
  }

  // Login de customer
  async login(clientId: string, loginDto: any) {
    const { email, password } = loginDto;

    // Buscar customer
    const customer = await this.prisma.customer.findUnique({
      where: {
        clientId_email: {
          clientId,
          email,
        },
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Conta inativa');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, customer.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    // Gerar tokens
    const tokens = await this.generateTokens(customer.id, customer.email);

    return {
      ...tokens,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        emailVerified: customer.emailVerified,
      },
    };
  }

  // Buscar todos os customers
  async findAll(clientId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.customer.count({
        where: { clientId },
      }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Buscar customer por ID
  async findOne(clientId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  // Gerar tokens JWT
  private async generateTokens(customerId: string, email: string) {
    const payload = {
      sub: customerId,
      email,
      type: 'customer',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Validar customer pelo ID (para guards)
  async validateCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        emailVerified: true,
        clientId: true,
      },
    });

    if (!customer || !customer.isActive) {
      return null;
    }

    return customer;
  }
}
