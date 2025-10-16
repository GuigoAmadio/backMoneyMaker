import { Injectable, Logger } from '@nestjs/common';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  clientId?: string;
  metadata?: any;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000; // Manter últimos 1000 logs em memória

  addLog(logEntry: LogEntry) {
    this.logs.push(logEntry);

    // Limitar tamanho do array
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getFilteredLogs(filters: {
    level?: string;
    module?: string;
    clientId?: string;
    search?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filters.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters.module) {
      filtered = filtered.filter((log) => log.module === filters.module);
    }

    if (filters.clientId) {
      filtered = filtered.filter((log) => log.clientId === filters.clientId);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.metadata).toLowerCase().includes(searchLower),
      );
    }

    const limit = filters.limit || 100;
    return filtered.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    this.logger.log('🗑️ Logs limpos');
  }
}
