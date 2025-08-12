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
}
