import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ServicesService } from './services.service';
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

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  @ApiQuery({ name: 'category', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'active', required: false, description: 'Filtrar por status ativo' })
  async getAllServices(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('active') active?: string,
  ) {
    this.logger.log(`📋 [Services] Buscando todos os serviços para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;

    if (!clientId) {
      throw new Error('Cliente não identificado');
    }

    const filters = {
      category,
      active: active ? active === 'true' : undefined,
    };

    const services = await this.servicesService.getAllServices(clientId, filters);

    return {
      success: true,
      data: services,
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'Obter serviços disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de serviços disponíveis' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filtrar por funcionário' })
  @ApiQuery({ name: 'date', required: false, description: 'Data para verificar disponibilidade' })
  async getAvailableServices(
    @Req() req: AuthenticatedRequest,
    @Query('employeeId') employeeId?: string,
    @Query('date') date?: string,
  ) {
    this.logger.log(`🛍️ [Services] Buscando serviços disponíveis para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;

    if (!clientId) {
      throw new Error('Cliente não identificado');
    }

    const services = await this.servicesService.getAvailableServices(clientId, employeeId, date);

    return {
      success: true,
      data: services,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obter categorias de serviços' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async getServiceCategories(@Req() req: AuthenticatedRequest) {
    this.logger.log(
      `📂 [Services] Buscando categorias de serviços para usuário: ${req.user?.email}`,
    );

    const clientId = req.user?.clientId || req.clientId;

    const categories = await this.servicesService.getServiceCategories(clientId);

    return {
      success: true,
      data: categories,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Obter serviços mais populares' })
  @ApiResponse({ status: 200, description: 'Lista de serviços populares' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  async getPopularServices(@Req() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    this.logger.log(`⭐ [Services] Buscando serviços populares para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const limitNum = limit ? parseInt(limit) : 10;

    const services = await this.servicesService.getPopularServices(clientId, limitNum);

    return {
      success: true,
      data: services,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de serviços' })
  @ApiResponse({ status: 200, description: 'Estatísticas de serviços' })
  async getServiceStats(@Req() req: AuthenticatedRequest) {
    this.logger.log(
      `📊 [Services] Buscando estatísticas de serviços para usuário: ${req.user?.email}`,
    );

    const clientId = req.user?.clientId || req.clientId;

    const stats = await this.servicesService.getServiceStats(clientId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar serviço por ID' })
  @ApiResponse({ status: 200, description: 'Serviço encontrado' })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  async getServiceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.logger.log(`🔍 [Services] Buscando serviço ${id} para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;

    const service = await this.servicesService.getServiceById(clientId, id);

    return {
      success: true,
      data: service,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo serviço' })
  @ApiResponse({ status: 201, description: 'Serviço criado com sucesso' })
  async createService(@Req() req: AuthenticatedRequest, @Body() createServiceData: any) {
    this.logger.log(`➕ [Services] Criando serviço para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    // Verificar permissão
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      throw new Error('Permissão negada para criar serviços');
    }

    const service = await this.servicesService.createService(clientId, createServiceData);

    return {
      success: true,
      data: service,
      message: 'Serviço criado com sucesso',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso' })
  async updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateServiceData: any,
  ) {
    this.logger.log(`✏️ [Services] Atualizando serviço ${id} para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    // Verificar permissão
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      throw new Error('Permissão negada para atualizar serviços');
    }

    const service = await this.servicesService.updateService(clientId, id, updateServiceData);

    return {
      success: true,
      data: service,
      message: 'Serviço atualizado com sucesso',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar serviço' })
  @ApiResponse({ status: 200, description: 'Serviço deletado com sucesso' })
  async deleteService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.logger.log(`🗑️ [Services] Deletando serviço ${id} para usuário: ${req.user?.email}`);

    const clientId = req.user?.clientId || req.clientId;
    const userRole = req.user?.role;

    // Verificar permissão
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      throw new Error('Permissão negada para deletar serviços');
    }

    await this.servicesService.deleteService(clientId, id);

    return {
      success: true,
      message: 'Serviço deletado com sucesso',
    };
  }
}
