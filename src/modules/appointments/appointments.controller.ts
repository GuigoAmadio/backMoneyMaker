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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AppointmentStatus } from '@prisma/client';

@ApiTags('Agendamentos')
@Controller({ path: 'appointments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('calendar')
  @ApiOperation({ summary: 'Obter agendamentos para o calendário' })
  @ApiResponse({ status: 200, description: 'Agendamentos do calendário' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria' })
  async getCalendarAppointments(
    @Tenant() clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return await this.appointmentsService.getCalendarAppointments(
      clientId,
      startDate,
      endDate,
      categoryId,
    );
  }

  @Get('week')
  @ApiOperation({ summary: 'Obter agendamentos da semana' })
  @ApiResponse({ status: 200, description: 'Agendamentos da semana' })
  @ApiQuery({ name: 'date', required: false, description: 'Data de referência (YYYY-MM-DD)' })
  async getWeekAppointments(@Tenant() clientId: string, @Query('date') date?: string) {
    return await this.appointmentsService.getWeekAppointments(clientId, date);
  }

  @Get('today')
  @ApiOperation({ summary: 'Obter agendamentos de hoje' })
  @ApiResponse({ status: 200, description: 'Agendamentos de hoje' })
  async getTodayAppointments(@Tenant() clientId: string) {
    return await this.appointmentsService.getTodayAppointments(clientId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de agendamentos' })
  @ApiResponse({ status: 200, description: 'Estatísticas de agendamentos' })
  async getAppointmentStats(@Tenant() clientId: string) {
    return await this.appointmentsService.getAppointmentStats(clientId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Obter categorias de agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async getCategories(@Tenant() clientId: string) {
    return await this.appointmentsService.getCategories(clientId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Criar categoria de agendamento' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  async createCategory(@Tenant() clientId: string, @Body() categoryData: any) {
    return await this.appointmentsService.createCategory(clientId, categoryData);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Obter horários disponíveis' })
  @ApiResponse({ status: 200, description: 'Horários disponíveis' })
  @ApiQuery({ name: 'date', required: true, description: 'Data (YYYY-MM-DD)' })
  @ApiQuery({ name: 'duration', required: false, description: 'Duração em minutos' })
  async getAvailableSlots(
    @Tenant() clientId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    const durationMinutes = duration ? parseInt(duration) : 60;
    return await this.appointmentsService.getAvailableSlots(clientId, date, durationMinutes);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria' })
  async findAll(
    @Tenant() clientId: string,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const filters = {
      status,
      startDate,
      endDate,
      categoryId,
    };
    return await this.appointmentsService.findAll(clientId, paginationDto, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.appointmentsService.findOne(id, clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async create(@Body() createAppointmentDto: any, @Tenant() clientId: string) {
    return await this.appointmentsService.create(createAppointmentDto, clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: any,
    @Tenant() clientId: string,
  ) {
    return await this.appointmentsService.update(id, updateAppointmentDto, clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.appointmentsService.remove(id, clientId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Tenant() clientId: string,
  ) {
    return await this.appointmentsService.updateStatus(id, status as AppointmentStatus, clientId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Criar múltiplos agendamentos' })
  @ApiResponse({ status: 201, description: 'Agendamentos criados com sucesso' })
  async createBulk(@Body() appointments: any[], @Tenant() clientId: string) {
    return await this.appointmentsService.createBulk(appointments, clientId);
  }
}
