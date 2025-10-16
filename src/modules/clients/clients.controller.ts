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
  OnModuleInit,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Clientes')
@Controller({ path: 'clients', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController implements OnModuleInit {
  private readonly logger = new Logger(ClientsController.name);

  constructor(private readonly clientsService: ClientsService) {}

  onModuleInit() {
    this.logger.log('🚀 ClientsController foi carregado e inicializado');
    this.logger.log(
      '📍 Rotas registradas: GET /clients, POST /clients, GET /clients/:id, PATCH /clients/:id, DELETE /clients/:id, GET /clients/by-employee/:userId',
    );
  }

  // ==================== ROTAS ESPECÍFICAS (ANTES das rotas com parâmetros) ====================

  @Get('count')
  @ApiOperation({ summary: 'Obter quantidade total de clientes' })
  @ApiResponse({ status: 200, description: 'Quantidade de clientes retornada com sucesso' })
  async getClientsCount(@Tenant() clientId: string) {
    this.logger.log('🔢 ROTA GET /clients/count CHAMADA!');
    this.logger.log(`🏢 ClientId: ${clientId}`);

    try {
      const result = await this.clientsService.getClientsCount(clientId || 'default-client-id');
      this.logger.log('✅ Quantidade de clientes obtida com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao obter quantidade de clientes:', error);
      throw error;
    }
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obter dados dos clientes para dashboard' })
  @ApiResponse({ status: 200, description: 'Dados dos clientes obtidos com sucesso' })
  async getClientsForDashboard() {
    this.logger.log('📊 ROTA GET /clients/dashboard CHAMADA!');

    try {
      const result = await this.clientsService.getClientsForDashboard();
      this.logger.log('✅ Dados dos clientes para dashboard obtidos com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao obter dados dos clientes para dashboard:', error);
      throw error;
    }
  }

  @Get('dashboard/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obter dados específicos de um cliente para dashboard' })
  @ApiResponse({ status: 200, description: 'Dados do cliente obtidos com sucesso' })
  async getClientForDashboard(@Param('clientId') clientId: string) {
    this.logger.log(`📊 ROTA GET /clients/dashboard/${clientId} CHAMADA!`);

    try {
      const result = await this.clientsService.getClientForDashboard(clientId);
      this.logger.log('✅ Dados do cliente para dashboard obtidos com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao obter dados do cliente para dashboard:', error);
      throw error;
    }
  }


  @Get('services/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Obter dados específicos de um cliente para dashboard' })
  @ApiResponse({ status: 200, description: 'Dados do cliente obtidos com sucesso' })
  async getServicesForClient(@Param('clientId') clientId: string) {
    this.logger.log(`📊 ROTA GET /clients/dashboard/${clientId} CHAMADA!`);

    try {
      const result = await this.clientsService.getClientForDashboard(clientId);
      this.logger.log('✅ Dados do cliente para dashboard obtidos com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao obter dados do cliente para dashboard:', error);
      throw error;
    }
  }

  @Get('by-employee/:userId')
  @ApiOperation({ summary: 'Buscar clientes por funcionário (usando user_id)' })
  @ApiResponse({ status: 200, description: 'Clientes encontrados com sucesso' })
  async findClientsByEmployee(@Param('userId') employeeId: string, @Tenant() clientId: string) {
    this.logger.log(`👥 ROTA GET /clients/by-employee/${employeeId} CHAMADA!`);
    this.logger.log(`🏢 ClientId: ${clientId}`);
    this.logger.log(`👤 employeeId: ${employeeId}`);

    try {
      const result = await this.clientsService.findClientsByEmployee(employeeId);
      this.logger.log('✅ Busca de clientes por funcionário realizada com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro na busca de clientes por funcionário:', error);
      throw error;
    }
  }

  @Post('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Criar novo cliente via dashboard' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  async createClientFromDashboard(@Body() createClientDto: CreateClientDto) {
    this.logger.log('📊 ROTA POST /clients/dashboard CHAMADA!');

    try {
      const result = await this.clientsService.createClientFromDashboard(createClientDto);
      this.logger.log('✅ Cliente criado via dashboard com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao criar cliente via dashboard:', error);
      throw error;
    }
  }

  @Patch('dashboard/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Atualizar cliente via dashboard' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  async updateClientFromDashboard(
    @Param('clientId') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    this.logger.log(`📊 ROTA PATCH /clients/dashboard/${clientId} CHAMADA!`);

    try {
      const result = await this.clientsService.updateClientFromDashboard(clientId, updateClientDto);
      this.logger.log('✅ Cliente atualizado via dashboard com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar cliente via dashboard:', error);
      throw error;
    }
  }

  @Delete('dashboard/:clientId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENT)
  @ApiOperation({ summary: 'Excluir cliente via dashboard' })
  @ApiResponse({ status: 200, description: 'Cliente excluído com sucesso' })
  async deleteClientFromDashboard(@Param('clientId') clientId: string) {
    this.logger.log(`📊 ROTA DELETE /clients/dashboard/${clientId} CHAMADA!`);

    try {
      const result = await this.clientsService.deleteClientFromDashboard(clientId);
      this.logger.log('✅ Cliente excluído via dashboard com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao excluir cliente via dashboard:', error);
      throw error;
    }
  }

  // ==================== ROTAS GENÉRICAS (DEPOIS das rotas específicas) ====================

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso' })
  async findAll(@Query() query: GetClientsDto, @Tenant() clientId: string) {
    this.logger.log('🔍 ROTA GET /clients CHAMADA!');
    this.logger.log(`📋 Query params: ${JSON.stringify(query)}`);
    this.logger.log(`🏢 ClientId: ${clientId}`);

    try {
      const result = await this.clientsService.findAll(query, clientId || 'default-client-id');
      this.logger.log('✅ Busca de clientes realizada com sucesso');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro na busca de clientes:', error);
      throw error;
    }
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  async create(@Body() createClientDto: CreateClientDto, @Tenant() clientId: string) {
    this.logger.log('🆕 ROTA POST /clients CHAMADA!');
    return this.clientsService.create(createClientDto, clientId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado com sucesso' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string, ...args: any[]) {
    this.logger.log(`🔍 ROTA GET /clients/${id} CHAMADA!`);
    // Extrair req.user (definido pelo JwtStrategy) para repassar ao service
    const request =
      args && args[0]?.switchToHttp?.() ? args[0].switchToHttp().getRequest() : (undefined as any);
    const user = request?.user;
    const requester = user
      ? { userId: user.id, employeeId: user.employeeId, role: user.role }
      : undefined;
    return this.clientsService.findOne(id, clientId, requester);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso' })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`📝 ROTA PATCH /clients/${id} CHAMADA!`);
    return this.clientsService.update(id, updateClientDto, clientId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiResponse({ status: 200, description: 'Cliente removido com sucesso' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`🗑️ ROTA DELETE /clients/${id} CHAMADA!`);
    return this.clientsService.remove(id, clientId);
  }
}
