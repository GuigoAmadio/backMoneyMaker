import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca o ID do cliente pelo slug/subdomínio
   */
  async getClientIdBySlug(slug: string): Promise<string | null> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { slug },
        select: { id: true, status: true },
      });

      if (!client) {
        return null;
      }

      if (client.status !== 'ACTIVE') {
        throw new NotFoundException('Cliente inativo ou suspenso');
      }

      return client.id;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Verifica se o cliente existe e está ativo
   */
  async validateClient(clientId: string): Promise<boolean> {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { status: true, expiresAt: true },
      });

      if (!client) {
        return false;
      }

      if (client.status !== 'ACTIVE') {
        return false;
      }

      // Verificar se a assinatura não expirou
      if (client.expiresAt && client.expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém informações básicas do cliente
   */
  async getClientInfo(clientId: string) {
    return this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        settings: true,
        expiresAt: true,
      },
    });
  }

  /**
   * Aplica o filtro de tenant em queries do Prisma
   */
  applyTenantFilter(clientId: string, whereClause: any = {}) {
    return {
      ...whereClause,
      clientId,
    };
  }
} 