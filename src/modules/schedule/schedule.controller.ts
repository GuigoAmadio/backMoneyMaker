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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto, UpdateScheduleDto, GetSchedulesDto, ScheduleStatus } from './dto';

@ApiTags('Schedule')
@Controller({ path: 'schedule', version: '1' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova agenda' })
  @ApiResponse({ status: 201, description: 'Agenda criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito - agenda já existe para esta data' })
  async create(@Request() req, @Body() createScheduleDto: CreateScheduleDto) {
    const { clientId, userId } = req.user;
    return this.scheduleService.create(clientId, userId, createScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de agendas retornada com sucesso' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data de início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data de fim (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date', required: false, description: 'Data específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, enum: ScheduleStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'publicOnly', required: false, type: 'boolean' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por título ou descrição' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Página (padrão: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Limite por página (padrão: 20)',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo para ordenação (padrão: date)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Ordem (asc/desc, padrão: asc)' })
  async findAll(@Request() req, @Query() query: GetSchedulesDto) {
    const { clientId, userId } = req.user;
    return this.scheduleService.findAll(clientId, userId, query);
  }

  @Get('today')
  @ApiOperation({ summary: 'Obter agendas de hoje' })
  @ApiResponse({ status: 200, description: 'Agendas de hoje retornadas com sucesso' })
  async getTodaySchedules(@Request() req) {
    const { clientId, userId } = req.user;
    return this.scheduleService.getTodaySchedules(clientId, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas das agendas' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async getScheduleStats(@Request() req) {
    const { clientId, userId } = req.user;
    return this.scheduleService.getScheduleStats(clientId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agenda por ID' })
  @ApiResponse({ status: 200, description: 'Agenda encontrada' })
  @ApiResponse({ status: 404, description: 'Agenda não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da agenda' })
  async findOne(@Request() req, @Param('id') id: string) {
    const { clientId, userId } = req.user;
    return this.scheduleService.findOne(id, clientId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agenda' })
  @ApiResponse({ status: 200, description: 'Agenda atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Agenda não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da agenda' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    const { clientId, userId } = req.user;
    return this.scheduleService.update(id, clientId, userId, updateScheduleDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da agenda' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agenda não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da agenda' })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: ScheduleStatus },
  ) {
    const { clientId, userId } = req.user;
    return this.scheduleService.updateStatus(id, clientId, userId, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar agenda' })
  @ApiResponse({ status: 204, description: 'Agenda deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Agenda não encontrada' })
  @ApiParam({ name: 'id', description: 'ID da agenda' })
  async remove(@Request() req, @Param('id') id: string) {
    const { clientId, userId } = req.user;
    return this.scheduleService.remove(id, clientId, userId);
  }
}
