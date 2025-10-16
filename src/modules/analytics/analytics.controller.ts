import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller('analytics')
@UseGuards(TenantGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/v1/analytics
   * Obtém dados gerais de analytics do cliente
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getClientAnalytics(
    @Request() req: any,
    @Query('period') period: string = 'month',
    @Query('includeInsights') includeInsights: boolean = true,
  ) {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const filters = {
      period,
      includeInsights,
    };

    const data = await this.analyticsService.getClientAnalytics(clientId, filters);

    return {
      success: true,
      data,
      message: 'Analytics carregados com sucesso',
    };
  }

  /**
   * GET /api/v1/analytics/ecommerce
   * Analytics específicos de e-commerce
   */
  @Get('ecommerce')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getEcommerceAnalytics(@Request() req: any, @Query('period') period: string = 'month') {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const data = await this.analyticsService.getEcommerceAnalytics(clientId, period);

    return {
      success: true,
      data,
      message: 'Analytics de e-commerce carregados com sucesso',
    };
  }

  /**
   * GET /api/v1/analytics/appointments
   * Analytics específicos de agendamentos
   */
  @Get('appointments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getAppointmentsAnalytics(@Request() req: any, @Query('period') period: string = 'month') {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const data = await this.analyticsService.getAppointmentsAnalytics(clientId, period);

    return {
      success: true,
      data,
      message: 'Analytics de agendamentos carregados com sucesso',
    };
  }

  /**
   * GET /api/v1/analytics/users
   * Analytics específicos de usuários
   */
  @Get('users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getUsersAnalytics(@Request() req: any, @Query('period') period: string = 'month') {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const data = await this.analyticsService.getUsersAnalytics(clientId, period);

    return {
      success: true,
      data,
      message: 'Analytics de usuários carregados com sucesso',
    };
  }

  /**
   * GET /api/v1/analytics/behavior
   * Analytics de comportamento (baseado em eventos)
   */
  @Get('behavior')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getBehaviorAnalytics(@Request() req: any, @Query('period') period: string = 'month') {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const data = await this.analyticsService.getBehaviorAnalytics(clientId, period);

    return {
      success: true,
      data,
      message: 'Analytics de comportamento carregados com sucesso',
    };
  }

  /**
   * POST /api/v1/analytics/track
   * Registra eventos de tracking
   */
  @Post('track')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async trackEvent(
    @Request() req: any,
    @Body()
    eventData: {
      type: 'page_view' | 'click' | 'conversion' | 'api_call';
      userId?: string;
      sessionId?: string;
      data?: any;
    },
  ) {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    const event = await this.analyticsService.trackEvent(clientId, eventData);

    return {
      success: true,
      data: event,
      message: 'Evento registrado com sucesso',
    };
  }

  /**
   * GET /api/v1/analytics/trends
   * Obtém tendências ao longo do tempo
   */
  @Get('trends')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getTrends(
    @Request() req: any,
    @Query('period') period: string = 'month',
    @Query('metric') metric: string = 'revenue',
  ) {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    // Implementar lógica de tendências baseada na métrica solicitada
    // Por enquanto, retornar dados mockados
    const mockTrends = {
      revenue: [
        { date: '2024-01-01', value: 1500 },
        { date: '2024-01-02', value: 1750 },
        { date: '2024-01-03', value: 1200 },
        { date: '2024-01-04', value: 2100 },
        { date: '2024-01-05', value: 1850 },
      ],
      users: [
        { date: '2024-01-01', value: 45 },
        { date: '2024-01-02', value: 52 },
        { date: '2024-01-03', value: 38 },
        { date: '2024-01-04', value: 61 },
        { date: '2024-01-05', value: 55 },
      ],
      appointments: [
        { date: '2024-01-01', value: 12 },
        { date: '2024-01-02', value: 15 },
        { date: '2024-01-03', value: 8 },
        { date: '2024-01-04', value: 18 },
        { date: '2024-01-05', value: 14 },
      ],
    };

    return {
      success: true,
      data: mockTrends[metric] || mockTrends.revenue,
      message: `Tendências de ${metric} carregadas com sucesso`,
    };
  }

  /**
   * GET /api/v1/analytics/reports
   * Obtém relatórios gerados
   */
  @Get('reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async getReports(@Request() req: any) {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    // TODO: Implementar busca real de relatórios após criar migração
    // Por enquanto, retornar dados mockados
    const mockReports = [
      {
        id: '1',
        clientId,
        name: 'Relatório Mensal - Janeiro 2024',
        description: 'Análise completa do mês de janeiro',
        filters: { period: 'month' },
        data: {},
        generatedAt: '2024-01-31T23:59:59Z',
        generatedBy: 'system',
      },
    ];

    return {
      success: true,
      data: mockReports,
      message: 'Relatórios carregados com sucesso',
    };
  }

  /**
   * POST /api/v1/analytics/reports
   * Gera um novo relatório
   */
  @Post('reports')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  async generateReport(
    @Request() req: any,
    @Body()
    reportData: {
      name: string;
      description?: string;
      filters: any;
    },
  ) {
    const clientId = req.tenant?.clientId;

    if (!clientId) {
      throw new Error('Client ID não encontrado');
    }

    // TODO: Implementar geração real de relatórios
    const newReport = {
      id: `report-${Date.now()}`,
      clientId,
      name: reportData.name,
      description: reportData.description,
      filters: reportData.filters,
      data: {},
      generatedAt: new Date().toISOString(),
      generatedBy: 'system',
    };

    return {
      success: true,
      data: newReport,
      message: 'Relatório gerado com sucesso',
    };
  }
}
