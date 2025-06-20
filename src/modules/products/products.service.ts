import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implementar CRUD de produtos
  async findAll(clientId: string) {
    return this.prisma.product.findMany({
      where: { clientId },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
} 