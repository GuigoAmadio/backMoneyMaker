import { Injectable, Logger } from '@nestjs/common';
import { RedisService, CacheConfig } from './redis.service';
import { CacheMetricsService } from './cache-metrics.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    private redisService: RedisService,
    private cacheMetrics: CacheMetricsService,
  ) {
    this.logger.log('CacheService initialized with Redis direct connection');
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string, clientId?: string, prefix?: string): Promise<T | null> {
    const startTime = Date.now();
    const result = await this.redisService.get<T>(key, clientId, prefix);
    const duration = Date.now() - startTime;

    if (result !== null) {
      this.cacheMetrics.recordHit(duration);
    } else {
      this.cacheMetrics.recordMiss();
    }

    return result;
  }

  /**
   * Definir valor no cache
   */
  async set<T>(key: string, value: T, clientId?: string, config?: CacheConfig): Promise<void> {
    const startTime = Date.now();
    await this.redisService.set(key, value, clientId, config);
    const duration = Date.now() - startTime;

    this.cacheMetrics.recordSet(duration);
  }

  /**
   * Remover do cache
   */
  async delete(key: string, clientId?: string, prefix?: string): Promise<void> {
    await this.redisService.delete(key, clientId, prefix);
    this.cacheMetrics.recordDelete();
  }

  /**
   * Cache com TTL específico
   */
  async setWithTTL<T>(
    key: string,
    value: T,
    ttl: number,
    clientId?: string,
    prefix?: string,
  ): Promise<void> {
    await this.redisService.setWithTTL(key, value, ttl, clientId, prefix);
  }

  /**
   * Obter valor com TTL (compatibilidade)
   */
  async getWithTTL<T>(key: string, clientId?: string, prefix?: string): Promise<T | null> {
    return this.redisService.getWithTTL<T>(key, clientId, prefix);
  }

  /**
   * Verificar se chave existe
   */
  async exists(key: string, clientId?: string, prefix?: string): Promise<boolean> {
    return this.redisService.exists(key, clientId, prefix);
  }

  /**
   * Obter TTL de uma chave
   */
  async getTTL(key: string, clientId?: string, prefix?: string): Promise<number> {
    return this.redisService.getTTL(key, clientId, prefix);
  }

  /**
   * Definir TTL de uma chave
   */
  async setTTL(key: string, ttl: number, clientId?: string, prefix?: string): Promise<boolean> {
    return this.redisService.setTTL(key, ttl, clientId, prefix);
  }

  /**
   * Incrementar contador
   */
  async increment(key: string, value = 1, clientId?: string): Promise<number> {
    return this.redisService.increment(key, value, clientId);
  }

  /**
   * Definir múltiplos valores
   */
  async mset(values: Record<string, any>, clientId?: string, ttl?: number): Promise<void> {
    await this.redisService.mset(values, clientId, ttl);
  }

  /**
   * Obter chaves por padrão
   */
  async getKeys(pattern: string = '*', limit: number = 50, offset: number = 0): Promise<string[]> {
    return this.redisService.getKeys(pattern, limit, offset);
  }

  /**
   * Contar chaves por padrão
   */
  async getKeyCount(pattern: string = '*'): Promise<number> {
    return this.redisService.getKeyCount(pattern);
  }

  /**
   * Invalidar por padrão
   */
  async deletePattern(pattern: string): Promise<number> {
    return this.redisService.deletePattern(pattern);
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<number> {
    const count = await this.redisService.clear();
    this.cacheMetrics.recordClear();
    return count;
  }

  /**
   * Cache com fallback para função
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    clientId?: string,
    config?: CacheConfig,
  ): Promise<T> {
    return this.redisService.getOrSet(key, fetchFn, clientId, config);
  }

  /**
   * Invalidar cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await this.redisService.invalidateByTags(tags);
  }

  /**
   * Verificar se está conectado
   */
  async isConnected(): Promise<boolean> {
    return this.redisService.isConnected();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    return this.cacheMetrics.getStats();
  }

  /**
   * Obter estatísticas do Redis
   */
  async getRedisStats(): Promise<any> {
    return this.redisService.getStats();
  }

  /**
   * Obter padrões comuns
   */
  async getCommonPatterns(): Promise<{ pattern: string; count: number; examples: string[] }[]> {
    return this.redisService.getCommonPatterns();
  }

  // Métodos de compatibilidade (mantidos para não quebrar código existente)

  /**
   * Invalidar cache por padrão (método antigo)
   */
  async invalidatePattern(pattern: string, clientId?: string): Promise<void> {
    await this.deletePattern(pattern);
  }

  /**
   * Limpar todo o cache (método antigo)
   */
  async clearAll(): Promise<void> {
    await this.clear();
  }

  /**
   * Obter tamanho da chave (método antigo)
   */
  async getKeySize(key: string): Promise<string> {
    try {
      const exists = await this.exists(key);
      return exists ? 'exists' : 'not found';
    } catch (error) {
      return 'error';
    }
  }

  /**
   * Obter uso de memória (método antigo)
   */
  async getMemoryUsage(): Promise<string> {
    try {
      const stats = await this.getRedisStats();
      return `Connected: ${stats.connected}, Keys: ${stats.keysCount}`;
    } catch (error) {
      return 'Error getting memory usage';
    }
  }
}
