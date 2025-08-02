import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Cacheable({
    key: 'dashboard:stats',
    ttl: 300, // 5 minutos
    tags: ['dashboard', 'stats'],
  })
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  async getStats(
    @Tenant() clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.dashboardService.getStats(clientId, startDate, endDate);
  }

  @Get('cache/clear')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Limpar cache do dashboard' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['dashboard']);
    return { success: true, message: 'Cache do dashboard limpo com sucesso' };
  }

  @Get('cache/stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas do cache do dashboard' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
