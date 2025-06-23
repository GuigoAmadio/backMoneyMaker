import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ========================================
  // ENDPOINTS PÚBLICOS (sem autenticação)
  // ========================================

  @Public()
  @Get('public')
  async getPublicProperties(@Tenant() clientId: string) {
    return this.propertiesService.getPublicProperties(clientId);
  }

  @Public()
  @Post(':id/lead')
  async createPublicLead(
    @Tenant() clientId: string,
    @Param('id') propertyId: string,
    @Body() data: any,
  ) {
    return this.propertiesService.createPublicLead(clientId, propertyId, data);
  }

  // ========================================
  // ENDPOINTS PRIVADOS (com autenticação)
  // ========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getAllProperties(@Tenant() clientId: string) {
    return this.propertiesService.getAllProperties(clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async createProperty(@Tenant() clientId: string, @Body() data: any) {
    return this.propertiesService.createProperty(clientId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('dashboard')
  async getDashboardStats(@Tenant() clientId: string) {
    return this.propertiesService.getDashboardStats(clientId);
  }
}
