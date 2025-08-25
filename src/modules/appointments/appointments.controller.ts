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
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AppointmentStatus } from '@prisma/client';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Cacheable, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheService } from '../../common/cache/cache.service';
import { CacheEventsController } from '../cache/cache-events.controller';
import { CacheMetadataService } from '../cache/cache-metadata.service';

@ApiTags('Agendamentos')
@Controller({ path: 'appointments', version: '1' })
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly cacheService: CacheService,
    private readonly cacheMetadataService: CacheMetadataService,
  ) {}

  @Get('count')
  @Cacheable({
    key: 'appointments:count',
    ttl: 300, // 5 minutos
    tags: ['appointments', 'count'],
  })
  @ApiOperation({ summary: 'Obter quantidade de agendamentos' })
  @ApiResponse({ status: 200, description: 'Quantidade de agendamentos' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Status do agendamento' })
  async getAppointmentsCount(
    @Tenant() clientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(
      `Obtendo quantidade de agendamentos para clientId: ${clientId}, startDate: ${startDate}, endDate: ${endDate}, status: ${status}`,
    );

    const result = await this.appointmentsService.getAppointmentsCount(
      clientId,
      startDate,
      endDate,
      status as AppointmentStatus,
    );

    this.logger.log(`Quantidade de agendamentos retornada com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('calendar')
  @Cacheable({
    key: 'appointments:calendar',
    ttl: 300, // 5 minutos
    tags: ['appointments', 'calendar'],
  })
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
    this.logger.log(
      `Obtendo agendamentos do calendário para clientId: ${clientId}, startDate: ${startDate}, endDate: ${endDate}, categoryId: ${categoryId}`,
    );

    const result = await this.appointmentsService.getCalendarAppointments(
      clientId,
      startDate,
      endDate,
      categoryId,
    );

    this.logger.log(`Agendamentos do calendário retornados com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('week')
  @Cacheable({
    key: 'appointments:week',
    ttl: 300, // 5 minutos
    tags: ['appointments', 'week'],
  })
  @ApiOperation({ summary: 'Obter agendamentos da semana' })
  @ApiResponse({ status: 200, description: 'Agendamentos da semana' })
  @ApiQuery({ name: 'date', required: false, description: 'Data de referência (YYYY-MM-DD)' })
  async getWeekAppointments(@Tenant() clientId: string, @Query('date') date?: string) {
    this.logger.log(`Obtendo agendamentos da semana para clientId: ${clientId}, date: ${date}`);

    const result = await this.appointmentsService.getWeekAppointments(clientId, date);

    this.logger.log(`Agendamentos da semana retornados com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('today')
  @Cacheable({
    key: 'appointments:today',
    ttl: 180, // 3 minutos
    tags: ['appointments', 'today'],
  })
  @ApiOperation({ summary: 'Obter agendamentos de hoje' })
  @ApiResponse({ status: 200, description: 'Agendamentos de hoje' })
  async getTodayAppointments(@Tenant() clientId: string) {
    this.logger.log(`Obtendo agendamentos de hoje para clientId: ${clientId}`);

    const result = await this.appointmentsService.getTodayAppointments(clientId);

    this.logger.log(`Agendamentos de hoje retornados com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Get('stats')
  @Cacheable({
    key: 'appointments:stats',
    ttl: 600, // 10 minutos
    tags: ['appointments', 'stats'],
  })
  @ApiOperation({ summary: 'Obter estatísticas de agendamentos' })
  @ApiResponse({ status: 200, description: 'Estatísticas de agendamentos' })
  async getAppointmentStats(@Tenant() clientId: string) {
    this.logger.log(`Obtendo estatísticas de agendamentos para clientId: ${clientId}`);

    const result = await this.appointmentsService.getAppointmentStats(clientId);

    this.logger.log(
      `Estatísticas de agendamentos retornadas com sucesso para clientId: ${clientId}`,
    );
    return result;
  }

  @Get('categories')
  @Cacheable({
    key: 'appointments:categories',
    ttl: 1800, // 30 minutos
    tags: ['appointments', 'categories'],
  })
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
    return await this.appointmentsService.getAvailableSlots(date, durationMinutes);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter meus agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista dos meus agendamentos' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  async getMyAppointments(@Tenant() clientId: string, @Query() query: any, @Req() req: any) {
    this.logger.log(`Obtendo agendamentos do usuário para clientId: ${clientId}`);

    // Extrair user do request (já autenticado pelo JwtAuthGuard)
    const user = req.user;

    if (!user || !user.id) {
      throw new Error('Usuário não autenticado');
    }

    const filters = {
      userId: user.id,
      status: query.status,
      limit: query.limit ? parseInt(query.limit) : 50,
    };

    const result = await this.appointmentsService.getMyAppointments(clientId, user.id, filters);

    this.logger.log(`Agendamentos do usuário retornados com sucesso para clientId: ${clientId}`);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por usuário' })
  async findAll(@Tenant() clientId: string, @Query() query: GetAppointmentsDto) {
    const filters = {
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      categoryId: query.categoryId,
      employeeId: query.employeeId,
      userId: query.userId,
    };
    return await this.appointmentsService.findAll(clientId, query, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(@Param('id') id: string, @Tenant() clientId: string) {
    return await this.appointmentsService.findOne(id, clientId);
  }

  @Post()
  @ApiHeader({
    name: 'x-client-id',
    description: 'ID do cliente',
    required: true,
  })
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @Tenant() clientId: string) {
    this.logger.log(`Criando agendamento para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(createAppointmentDto)}`);

    createAppointmentDto.clientId = clientId;

    const result = await this.appointmentsService.create(createAppointmentDto);

    // ✅ Atualizar metadata de cache
    console.log(
      `🔄 [Appointments] Atualizando cache metadata após criação - clientId: ${clientId}`,
    );
    await this.cacheMetadataService.updateCacheMetadata(clientId, 'appointments');

    // ✅ Emitir evento SSE para invalidação em tempo real
    console.log(
      `📡 [Appointments] Emitindo evento SSE após criação - appointmentId: ${result.data?.id}`,
    );
    CacheEventsController.invalidateAppointmentsCache(clientId, result.data?.id);
    console.log(`✅ [Appointments] Cache e SSE processados com sucesso após criação`);

    this.logger.log(`Agendamento criado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Tenant() clientId: string,
  ) {
    this.logger.log(`Atualizando agendamento ${id} para clientId: ${clientId}`);
    this.logger.debug(`Dados recebidos: ${JSON.stringify(updateAppointmentDto)}`);

    const result = await this.appointmentsService.update(id, clientId, updateAppointmentDto);

    // ✅ Atualizar metadata de cache
    console.log(
      `🔄 [Appointments] Atualizando cache metadata após atualização - clientId: ${clientId}, appointmentId: ${id}`,
    );
    await this.cacheMetadataService.updateCacheMetadata(clientId, 'appointments');

    // ✅ Emitir evento SSE para invalidação em tempo real
    console.log(`📡 [Appointments] Emitindo evento SSE após atualização - appointmentId: ${id}`);
    CacheEventsController.invalidateAppointmentsCache(clientId, id);
    console.log(`✅ [Appointments] Cache e SSE processados com sucesso após atualização`);

    this.logger.log(`Agendamento atualizado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async remove(@Param('id') id: string, @Tenant() clientId: string) {
    this.logger.log(`Deletando agendamento ${id} para clientId: ${clientId}`);

    const result = await this.appointmentsService.remove(id);

    // ✅ Atualizar metadata de cache
    await this.cacheMetadataService.updateCacheMetadata(clientId, 'appointments');

    // ✅ Emitir evento SSE para invalidação em tempo real
    CacheEventsController.invalidateAppointmentsCache(clientId, id);

    this.logger.log(`Agendamento deletado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Tenant() clientId: string,
  ) {
    this.logger.log(
      `Atualizando status do agendamento ${id} para ${status} em clientId: ${clientId}`,
    );

    const result = await this.appointmentsService.updateStatus(id, status as AppointmentStatus);

    // ✅ Atualizar metadata de cache
    await this.cacheMetadataService.updateCacheMetadata(clientId, 'appointments');

    // ✅ Emitir evento SSE para invalidação em tempo real
    CacheEventsController.invalidateAppointmentsCache(clientId, id);

    this.logger.log(`Status do agendamento atualizado com sucesso para clientId: ${clientId}`);
    return result;
  }

  @Post('bulk')
  @CacheInvalidate('appointments:calendar')
  @ApiOperation({ summary: 'Criar múltiplos agendamentos' })
  @ApiResponse({ status: 201, description: 'Agendamentos criados com sucesso' })
  async createBulk(@Body() appointments: any[], @Tenant() clientId: string) {
    const result = await this.appointmentsService.createBulk(appointments);

    // Invalidar cache relacionado
    await this.cacheService.invalidateByTags(['appointments']);

    return result;
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpar cache de agendamentos' })
  async clearCache() {
    await this.cacheService.invalidateByTags(['appointments']);
    return { success: true, message: 'Cache de agendamentos limpo com sucesso' };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Obter estatísticas do cache de agendamentos' })
  async getCacheStats() {
    return this.cacheService.getStats();
  }
}
