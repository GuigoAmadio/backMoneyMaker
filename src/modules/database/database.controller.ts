import { Controller, Get, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DatabaseService } from './database.service';

@ApiTags('Database')
@Controller({ path: 'database', version: '1' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN') // Apenas SUPER_ADMIN pode acessar informações do banco
export class DatabaseController {
  private readonly logger = new Logger(DatabaseController.name);

  constructor(private readonly databaseService: DatabaseService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas gerais do banco de dados' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getDatabaseStats(@Request() req) {
    const clientId = req.clientId; // Usa req.clientId do TenantInterceptor
    this.logger.log(
      `Buscando estatísticas do banco${clientId ? ` filtrado por clientId: ${clientId}` : ' (todos os clientes)'}`,
    );
    return this.databaseService.getDatabaseStats(clientId);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Listar todas as tabelas com informações' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tabelas retornada com sucesso',
  })
  async getTablesInfo(@Request() req) {
    const clientId = req.xClientId;
    this.logger.log(
      `Buscando informações das tabelas${clientId ? ` filtrado por clientId: ${clientId}` : ' (todos os clientes)'}`,
    );
    return this.databaseService.getTablesInfo(clientId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar saúde do banco de dados' })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde retornado com sucesso',
  })
  async getDatabaseHealth(@Request() req) {
    const clientId = req.clientId;
    this.logger.log(`Verificando saúde do banco`);
    return this.databaseService.getDatabaseHealth();
  }

  @Get('connections')
  @ApiOperation({ summary: 'Listar conexões ativas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conexões retornada com sucesso',
  })
  async getActiveConnections(@Request() req) {
    const clientId = req.clientId;
    this.logger.log(`Buscando conexões ativas`);
    return this.databaseService.getActiveConnections();
  }

  @Get('vacuum/:tableName')
  @ApiOperation({ summary: 'Executar VACUUM em uma tabela' })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela' })
  @ApiResponse({
    status: 200,
    description: 'VACUUM executado com sucesso',
  })
  async vacuumTable(@Request() req, @Param('tableName') tableName: string) {
    const clientId = req.clientId;
    this.logger.log(`Executando VACUUM na tabela ${tableName}`);
    return this.databaseService.vacuumTable(tableName);
  }

  @Get('analyze/:tableName')
  @ApiOperation({ summary: 'Executar ANALYZE em uma tabela' })
  @ApiParam({ name: 'tableName', description: 'Nome da tabela' })
  @ApiResponse({
    status: 200,
    description: 'ANALYZE executado com sucesso',
  })
  async analyzeTable(@Request() req, @Param('tableName') tableName: string) {
    const clientId = req.clientId;
    this.logger.log(`Executando ANALYZE na tabela ${tableName}`);
    return this.databaseService.analyzeTable(tableName);
  }
}
