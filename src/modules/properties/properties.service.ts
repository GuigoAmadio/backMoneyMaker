import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/tenant/tenant.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async getAllProperties(clientId: string) {
    return (this.prisma as any).property.findMany({
      where: this.tenantService.applyTenantFilter(clientId),
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicProperties(clientId: string) {
    return (this.prisma as any).property.findMany({
      where: this.tenantService.applyTenantFilter(clientId, { status: 'AVAILABLE' }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProperty(clientId: string, data: any) {
    return (this.prisma as any).property.create({
      data: { ...data, clientId },
    });
  }

  async createPublicLead(clientId: string, propertyId: string, data: any) {
    return (this.prisma as any).propertyLead.create({
      data: { ...data, clientId, propertyId, status: 'NEW' },
    });
  }

  async getDashboardStats(clientId: string) {
    const [totalProperties, availableProperties] = await Promise.all([
      (this.prisma as any).property.count({
        where: this.tenantService.applyTenantFilter(clientId),
      }),
      (this.prisma as any).property.count({
        where: this.tenantService.applyTenantFilter(clientId, { status: 'AVAILABLE' }),
      }),
    ]);

    return {
      properties: { total: totalProperties, available: availableProperties },
    };
  }
}
