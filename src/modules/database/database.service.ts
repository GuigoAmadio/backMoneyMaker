import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obter estatísticas gerais do banco de dados
   * @param clientId - ID do cliente para filtrar (opcional)
   */
  async getDatabaseStats(clientId?: string) {
    try {
      const startTime = Date.now();
      this.logger.log(
        `🔍 Buscando estatísticas${clientId ? ` para cliente ${clientId}` : ' gerais'}`,
      );

      // Estatísticas de conexões (sempre geral)
      const connectionsQuery = await this.prisma.$queryRaw<
        Array<{ total: bigint; active: bigint; idle: bigint; max_conn: number }>
      >`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_conn
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      // Tamanho do banco de dados (sempre geral)
      const databaseSizeQuery = await this.prisma.$queryRaw<
        Array<{ db_size: string; total_size: string }>
      >`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          pg_size_pretty(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint) as total_size
        FROM pg_tables
        WHERE schemaname = 'public'
      `;

      // Contagem de tabelas (sempre geral)
      const tablesCountQuery = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      `;

      // Uptime do banco (sempre geral)
      const uptimeQuery = await this.prisma.$queryRaw<Array<{ uptime: number }>>`
        SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as uptime
      `;

      // Contagem de registros - pode ser filtrado por clientId
      let totalRecords = 0;
      if (clientId) {
        totalRecords = await this.getClientRecordsCount(clientId);
      } else {
        const allRecordsQuery = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
          SELECT SUM(n_live_tup)::bigint as total
          FROM pg_stat_user_tables
        `;
        totalRecords = Number(allRecordsQuery[0]?.total || 0);
      }

      const connections = connectionsQuery[0];
      const sizes = databaseSizeQuery[0];
      const tablesCount = tablesCountQuery[0];
      const uptime = uptimeQuery[0];

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          total_connections: Number(connections.total),
          active_connections: Number(connections.active),
          idle_connections: Number(connections.idle),
          max_connections: connections.max_conn,
          database_size: sizes?.db_size || '0 bytes',
          total_size: sizes?.total_size || '0 bytes',
          tables_count: Number(tablesCount.count),
          uptime: Math.floor(uptime.uptime),
          total_records: totalRecords,
          filtered_by_client: !!clientId,
        },
        message: `Estatísticas do banco obtidas com sucesso${clientId ? ` (filtrado por cliente ${clientId})` : ''}`,
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas do banco:', error);
      throw error;
    }
  }

  /**
   * Contar registros de um cliente específico
   */
  private async getClientRecordsCount(clientId: string): Promise<number> {
    try {
      const [users, products, orders, appointments, schedules, transactions, workspaces] =
        await Promise.all([
          this.prisma.user.count({ where: { clientId } }),
          this.prisma.product.count({ where: { clientId } }),
          this.prisma.order.count({ where: { clientId } }),
          this.prisma.appointment.count({ where: { clientId } }),
          this.prisma.schedule.count({ where: { clientId } }),
          this.prisma.transaction.count({ where: { clientId } }),
          this.prisma.workspace.count({ where: { clientId } }),
        ]);

      const total =
        users + products + orders + appointments + schedules + transactions + workspaces;

      this.logger.log(`📊 Cliente ${clientId}: ${total} registros`);
      return total;
    } catch (error) {
      this.logger.error(`❌ Erro ao contar registros do cliente ${clientId}:`, error);
      return 0;
    }
  }

  /**
   * Obter informações sobre todas as tabelas
   * @param clientId - ID do cliente para filtrar contagens (opcional)
   */
  async getTablesInfo(clientId?: string) {
    try {
      this.logger.log(
        `🔍 Buscando informações das tabelas${clientId ? ` para cliente ${clientId}` : ' (todas)'}`,
      );

      // Buscar informações de tamanho das tabelas (sempre geral)
      const tables = await this.prisma.$queryRaw<
        Array<{
          table_name: string;
          row_count: bigint;
          total_size: string;
          indexes_size: string;
          table_size: string;
          schema: string;
        }>
      >`
        SELECT 
          t.schemaname as schema,
          t.tablename as table_name,
          pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as total_size,
          pg_size_pretty(pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as table_size,
          pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)) - pg_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as indexes_size,
          COALESCE(s.n_live_tup, 0)::bigint as row_count
        FROM pg_tables t
        LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.schemaname AND s.relname = t.tablename
        WHERE t.schemaname = 'public'
        ORDER BY pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)) DESC
      `;

      // Se clientId for fornecido, buscar contagens específicas para esse cliente
      let tablesData = tables.map((table) => ({
        table_name: table.table_name,
        schema: table.schema,
        row_count: Number(table.row_count || 0),
        total_size: table.total_size,
        indexes_size: table.indexes_size,
        table_size: table.table_size,
      }));

      if (clientId) {
        tablesData = await this.enrichTablesWithClientData(tablesData, clientId);
      }

      return {
        success: true,
        data: tablesData,
        message: `Informações das tabelas obtidas com sucesso${clientId ? ` (filtrado por cliente ${clientId})` : ''}`,
        filtered_by_client: !!clientId,
      };
    } catch (error) {
      this.logger.error('Erro ao obter informações das tabelas:', error);
      throw error;
    }
  }

  /**
   * Enriquecer dados das tabelas com contagens específicas do cliente
   */
  private async enrichTablesWithClientData(tables: any[], clientId: string): Promise<any[]> {
    const tableCountMap: Record<string, number> = {
      User: await this.prisma.user.count({ where: { clientId } }),
      Product: await this.prisma.product.count({ where: { clientId } }),
      Order: await this.prisma.order.count({ where: { clientId } }),
      Appointment: await this.prisma.appointment.count({ where: { clientId } }),
      Schedule: await this.prisma.schedule.count({ where: { clientId } }),
      Transaction: await this.prisma.transaction.count({ where: { clientId } }),
      Workspace: await this.prisma.workspace.count({ where: { clientId } }),
    };

    return tables.map((table) => {
      const count = tableCountMap[table.table_name];
      if (count !== undefined) {
        return {
          ...table,
          row_count: count,
          client_filtered_count: count,
        };
      }
      return table;
    });
  }

  /**
   * Verificar saúde do banco de dados
   */
  async getDatabaseHealth() {
    try {
      const startTime = Date.now();

      // Verificar conexão
      await this.prisma.$queryRaw`SELECT 1`;

      // Obter informações do banco
      const dbInfo = await this.prisma.$queryRaw<
        Array<{
          version: string;
          current_database: string;
          current_user: string;
        }>
      >`
        SELECT 
          version() as version,
          current_database() as current_database,
          current_user as current_user
      `;

      const responseTime = Date.now() - startTime;

      const info = dbInfo[0];
      const pgVersion = info.version.split(' ')[1] || 'Unknown';

      return {
        success: true,
        data: {
          status: 'ok',
          connected: true,
          response_time: responseTime,
          version: info.version,
          pg_version: pgVersion,
          current_database: info.current_database,
          current_user: info.current_user,
        },
        message: 'Banco de dados está saudável',
      };
    } catch (error) {
      this.logger.error('Erro ao verificar saúde do banco:', error);
      return {
        success: false,
        data: {
          status: 'error',
          connected: false,
          response_time: 0,
          version: 'Unknown',
          pg_version: 'Unknown',
          current_database: 'Unknown',
          current_user: 'Unknown',
        },
        message: 'Erro ao verificar saúde do banco',
      };
    }
  }

  /**
   * Obter conexões ativas
   */
  async getActiveConnections() {
    try {
      const connections = await this.prisma.$queryRaw<
        Array<{
          database: string;
          user: string;
          application_name: string;
          client_addr: string;
          state: string;
          query: string;
          query_start: Date;
          state_change: Date;
        }>
      >`
        SELECT 
          datname as database,
          usename as user,
          application_name,
          client_addr::text,
          state,
          query,
          query_start,
          state_change
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
        ORDER BY query_start DESC
        LIMIT 50
      `;

      return {
        success: true,
        data: connections.map((conn) => ({
          database: conn.database,
          user: conn.user,
          application_name: conn.application_name || 'N/A',
          client_addr: conn.client_addr || 'local',
          state: conn.state,
          query: conn.query || '<IDLE>',
          query_start: conn.query_start?.toISOString() || '',
          state_change: conn.state_change?.toISOString() || '',
        })),
        message: 'Conexões ativas obtidas com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao obter conexões ativas:', error);
      throw error;
    }
  }

  /**
   * Executar VACUUM em uma tabela
   */
  async vacuumTable(tableName: string) {
    try {
      this.logger.log(`Executando VACUUM na tabela: ${tableName}`);

      // Validar nome da tabela para evitar SQL injection
      const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      if (validTableName !== tableName) {
        throw new Error('Nome de tabela inválido');
      }

      // Executar VACUUM
      await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE "${validTableName}"`);

      return {
        success: true,
        data: {
          message: `VACUUM executado com sucesso na tabela ${tableName}`,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao executar VACUUM na tabela ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Executar ANALYZE em uma tabela
   */
  async analyzeTable(tableName: string) {
    try {
      this.logger.log(`Executando ANALYZE na tabela: ${tableName}`);

      // Validar nome da tabela para evitar SQL injection
      const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      if (validTableName !== tableName) {
        throw new Error('Nome de tabela inválido');
      }

      // Executar ANALYZE
      await this.prisma.$executeRawUnsafe(`ANALYZE "${validTableName}"`);

      return {
        success: true,
        data: {
          message: `ANALYZE executado com sucesso na tabela ${tableName}`,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao executar ANALYZE na tabela ${tableName}:`, error);
      throw error;
    }
  }
}
