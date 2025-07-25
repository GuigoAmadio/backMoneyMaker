import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';

@Controller('properties')
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cacheService: CacheService,
  ) {}

  // ========================================
  // ENDPOINTS PÚBLICOS (sem autenticação)
  // ========================================

  @Public()
  @Get('public')
  @Cacheable({
    key: 'properties:public',
    ttl: 900, // 15 minutos
    tags: ['properties', 'public'],
  })
  async getPublicProperties(@Tenant() clientId: string) {
    this.logger.log(`Obtendo propriedades públicas para clientId: ${clientId}`);
    return this.propertiesService.getPublicProperties(clientId);
  }

  @Public()
  @Post(':id/lead')
  async createPublicLead(
    @Tenant() clientId: string,
    @Param('id') propertyId: string,
    @Body() data: any,
  ) {
    this.logger.log(`Criando lead público para propriedade ${propertyId} em clientId: ${clientId}`);
    return this.propertiesService.createPublicLead(clientId, propertyId, data);
  }

  // ========================================
  // ENDPOINTS PRIVADOS (com autenticação)
  // ========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Cacheable({
    key: 'properties:all',
    ttl: 600, // 10 minutos
    tags: ['properties', 'all'],
  })
  async getAllProperties(@Tenant() clientId: string) {
    this.logger.log(`Obtendo todas as propriedades para clientId: ${clientId}`);
    return this.propertiesService.getAllProperties(clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @CacheInvalidate('properties:all')
  async createProperty(@Tenant() clientId: string, @Body() data: any) {
    this.logger.log(`Criando propriedade para clientId: ${clientId}`);
    const property = await this.propertiesService.createProperty(clientId, data);

    // Invalidar cache específico da propriedade criada
    if (property.data?.id) {
      await this.cacheService.delete(`properties:detail:${property.data.id}`);
    }

    return property;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('dashboard')
  @Cacheable({
    key: 'properties:dashboard',
    ttl: 300, // 5 minutos
    tags: ['properties', 'dashboard'],
  })
  async getDashboardStats(@Tenant() clientId: string) {
    this.logger.log(`Obtendo estatísticas do dashboard de propriedades para clientId: ${clientId}`);
    return this.propertiesService.getDashboardStats(clientId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('cache/clear')
  async clearCache() {
    await this.cacheService.invalidateByTags(['properties']);
    return { success: true, message: 'Cache de propriedades limpo com sucesso' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('cache/stats')
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
