import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(clientId: string, createCategoryDto: CreateCategoryDto) {
    this.logger.log(
      `Criando categoria para clientId: ${clientId}, nome: ${createCategoryDto.name}`,
    );

    try {
      // Verificar se o nome já está em uso
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          clientId,
          name: createCategoryDto.name,
        },
      });

      if (existingCategory) {
        this.logger.warn(
          `Nome de categoria já em uso: ${createCategoryDto.name} para clientId: ${clientId}`,
        );
        throw new ConflictException('Nome da categoria já está em uso');
      }

      const category = await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          clientId,
        },
        include: {
          _count: {
            select: {
              services: true,
              products: true,
            },
          },
        },
      });

      this.logger.log(`Categoria criada com sucesso: ${category.id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Categoria criada com sucesso',
        data: category,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar categoria para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findAll(clientId: string) {
    this.logger.log(`Listando categorias para clientId: ${clientId}`);

    try {
      const categories = await this.prisma.category.findMany({
        where: { clientId },
        include: {
          _count: {
            select: {
              services: true,
              products: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      this.logger.log(`Encontradas ${categories.length} categorias para clientId: ${clientId}`);

      return {
        success: true,
        data: categories,
        message: 'Categorias listadas com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao listar categorias para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async findOne(clientId: string, id: string) {
    this.logger.log(`Buscando categoria ${id} para clientId: ${clientId}`);

    try {
      const category = await this.prisma.category.findFirst({
        where: {
          id,
          clientId,
        },
        include: {
          services: {
            select: { id: true, name: true, isActive: true, price: true },
            where: { isActive: true },
          },
          products: {
            select: { id: true, name: true, isActive: true, price: true },
            where: { isActive: true },
          },
          _count: {
            select: {
              services: true,
              products: true,
            },
          },
        },
      });

      if (!category) {
        this.logger.warn(`Categoria não encontrada: ${id} para clientId: ${clientId}`);
        throw new NotFoundException('Categoria não encontrada');
      }

      this.logger.log(`Categoria encontrada: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar categoria ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async update(clientId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    this.logger.log(`Atualizando categoria ${id} para clientId: ${clientId}`);

    try {
      const category = await this.prisma.category.findFirst({
        where: { id, clientId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verificar se o nome já está em uso por outra categoria
      if (updateCategoryDto.name) {
        const existingCategory = await this.prisma.category.findFirst({
          where: {
            clientId,
            name: updateCategoryDto.name,
            NOT: { id },
          },
        });

        if (existingCategory) {
          throw new ConflictException('Nome da categoria já está em uso');
        }
      }

      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          _count: {
            select: {
              services: true,
              products: true,
            },
          },
        },
      });

      this.logger.log(`Categoria atualizada com sucesso: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: updatedCategory,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar categoria ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }

  async remove(clientId: string, id: string) {
    this.logger.log(`Removendo categoria ${id} para clientId: ${clientId}`);

    try {
      const category = await this.prisma.category.findFirst({
        where: { id, clientId },
        include: {
          _count: {
            select: {
              services: true,
              products: true,
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      // Verificar se há serviços ou produtos associados
      if (category._count.services > 0 || category._count.products > 0) {
        throw new BadRequestException(
          'Não é possível remover categoria com serviços ou produtos associados. Desative a categoria ao invés de removê-la.',
        );
      }

      await this.prisma.category.delete({
        where: { id },
      });

      this.logger.log(`Categoria removida com sucesso: ${id} para clientId: ${clientId}`);

      return {
        success: true,
        message: 'Categoria removida com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao remover categoria ${id} para clientId: ${clientId}`, error);
      throw error;
    }
  }
}
