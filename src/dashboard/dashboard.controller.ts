import { Controller, Get, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
    clientId: string;
  };
  clientId?: string;
}

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getDashboardStats(@Req() req: AuthenticatedRequest) {
    this.logger.log(`📊 [Dashboard] Buscando stats para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    if (!clientId) {
      throw new Error('Cliente não identificado');
    }

    const stats = await this.dashboardService.getDashboardStats(clientId, userRole);

    this.logger.log(`✅ [Dashboard] Stats obtidas para cliente: ${clientId}`);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('analytics/monthly')
  @ApiOperation({ summary: 'Obter analytics mensais' })
  async getMonthlyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    this.logger.log(`📈 [Dashboard] Buscando analytics mensais para: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    const analytics = await this.dashboardService.getMonthlyAnalytics(
      clientId,
      userRole,
      month,
      year,
    );

    return {
      success: true,
      data: analytics,
    };
  }

  @Get('analytics/personal')
  @ApiOperation({ summary: 'Obter analytics pessoais' })
  async getPersonalAnalytics(@Req() req: AuthenticatedRequest) {
    this.logger.log(`👤 [Dashboard] Buscando analytics pessoais para: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userId = req.user?.sub;
    const userRole = req.user?.role;

    const analytics = await this.dashboardService.getPersonalAnalytics(clientId, userId, userRole);

    return {
      success: true,
      data: analytics,
    };
  }
}
