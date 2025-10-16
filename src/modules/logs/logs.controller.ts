import { Controller, Get, Query, Logger, Delete, UseGuards, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { LogsEmitterService } from './logs-emitter.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Logs')
@Controller({ path: 'logs', version: '1' })
export class LogsController {
  private readonly logger = new Logger(LogsController.name);

  constructor(
    private readonly logsService: LogsService,
    private readonly logsEmitter: LogsEmitterService,
  ) {}

  @Get('recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar logs recentes' })
  @ApiResponse({ status: 200, description: 'Logs retornados com sucesso' })
  async getRecentLogs(@Query('limit') limit?: string) {
    this.logger.log(`📋 Buscando logs recentes (limit: ${limit || 100})`);

    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const logs = this.logsService.getRecentLogs(parsedLimit);

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  @Get('filtered')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar logs com filtros' })
  @ApiResponse({ status: 200, description: 'Logs filtrados retornados com sucesso' })
  async getFilteredLogs(
    @Query('level') level?: string,
    @Query('module') module?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log('📋 Buscando logs filtrados');

    const logs = this.logsService.getFilteredLogs({
      level,
      module,
      clientId,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  }

  @Delete()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Limpar todos os logs' })
  @ApiResponse({ status: 200, description: 'Logs limpos com sucesso' })
  async clearLogs() {
    this.logger.log('🗑️ Limpando logs');

    this.logsService.clearLogs();

    return {
      success: true,
      message: 'Logs limpos com sucesso',
    };
  }

  @Post('test')
  @ApiOperation({ summary: 'Emitir log de teste (desenvolvimento)' })
  @ApiResponse({ status: 201, description: 'Log de teste emitido com sucesso' })
  async testLog(
    @Body()
    data: {
      level?: string;
      message: string;
      module?: string;
      metadata?: any;
    },
  ) {
    const { level = 'info', message, module = 'TEST', metadata } = data;

    this.logger.log(`🧪 Emitindo log de teste: ${message}`);
    this.logsEmitter.emitLog(level, message, module, undefined, metadata);

    return {
      success: true,
      message: 'Log de teste emitido com sucesso',
      data: { level, message, module, metadata },
    };
  }
}
