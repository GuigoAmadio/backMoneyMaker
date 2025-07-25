import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType, RedisClientOptions } from 'redis';

export interface CacheConfig {
  ttl?: number;
  prefix?: string;
  tags?: string[];
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt?: number;
  ttl?: number;
  tags?: string[];
  createdAt: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private _isConnected = false;
  private readonly defaultTTL = 300; // 5 minutos

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private initializeClient() {
    const redisPassword = this.configService.get('REDIS_PASSWORD');

    const options: RedisClientOptions = {
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      database: this.configService.get('REDIS_DB', 0),
    };

    // Só adicionar password se estiver configurado
    if (redisPassword) {
      options.password = redisPassword;
    }

    this.client = createClient(options) as RedisClientType;

    // Event listeners
    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
      this._isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connecting...');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis Client Ready');
      this._isConnected = true;
    });

    this.client.on('end', () => {
      this.logger.log('Redis Client Disconnected');
      this._isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Redis Client Reconnecting...');
    });
  }

  private async connect() {
    try {
      if (!this._isConnected) {
        await this.client.connect();
        this.logger.log('Redis Client Connected Successfully');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.client && this._isConnected) {
        await this.client.quit();
        this.logger.log('Redis Client Disconnected Successfully');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  private async ensureConnection() {
    if (!this._isConnected) {
      await this.connect();
    }
  }

  /**
   * Gerar chave de cache com prefixo e client_id
   */
  private generateKey(key: string, clientId?: string, prefix?: string): string {
    const parts = [];
    if (prefix) parts.push(prefix);
    if (clientId) parts.push(`client:${clientId}`);
    parts.push(key);
    return parts.join(':');
  }

  /**
   * Serializar valor para Redis
   */
  private serialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  /**
   * Deserializar valor do Redis
   */
  private deserialize<T>(value: string | null): T | null {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      this.logger.error('Error deserializing value:', error);
      return null;
    }
  }

  /**
   * Definir valor no cache
   */
  async set<T>(key: string, value: T, clientId?: string, config?: CacheConfig): Promise<void> {
    const cacheKey = this.generateKey(key, clientId, config?.prefix);
    const ttl = config?.ttl || this.defaultTTL;

    try {
      await this.ensureConnection();

      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttl * 1000,
        ttl,
        tags: config?.tags,
        createdAt: Date.now(),
      };

      const serialized = this.serialize(entry);
      await this.client.set(cacheKey, serialized, { EX: ttl });

      this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);

      // Se tags foram especificadas, armazenar relação
      if (config?.tags?.length) {
        await this.addToTags(cacheKey, config.tags);
      }
    } catch (error) {
      this.logger.error(`Cache SET error for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Definir valor com TTL específico
   */
  async setWithTTL<T>(
    key: string,
    value: T,
    ttl: number,
    clientId?: string,
    prefix?: string,
  ): Promise<void> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();

      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttl * 1000,
        ttl,
        createdAt: Date.now(),
      };

      const serialized = this.serialize(entry);
      await this.client.set(cacheKey, serialized, { EX: ttl });

      this.logger.debug(`Cache SET with TTL: ${cacheKey} (${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache SET with TTL error for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string, clientId?: string, prefix?: string): Promise<T | null> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();

      const startTime = Date.now();
      const serialized = await this.client.get(cacheKey);
      const duration = Date.now() - startTime;

      if (serialized) {
        const entry = this.deserialize<CacheEntry<T>>(serialized);

        if (entry) {
          // Verificar se expirou
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            await this.client.del(cacheKey);
            this.logger.debug(`Cache EXPIRED: ${cacheKey}`);
            return null;
          }

          this.logger.debug(`Cache HIT: ${cacheKey} (${duration}ms)`);
          return entry.value;
        }
      }

      this.logger.debug(`Cache MISS: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Obter valor com TTL (compatibilidade)
   */
  async getWithTTL<T>(key: string, clientId?: string, prefix?: string): Promise<T | null> {
    return this.get<T>(key, clientId, prefix);
  }

  /**
   * Remover do cache
   */
  async delete(key: string, clientId?: string, prefix?: string): Promise<void> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();
      await this.client.del(cacheKey);
      this.logger.debug(`Cache DELETE: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Verificar se chave existe
   */
  async exists(key: string, clientId?: string, prefix?: string): Promise<boolean> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Obter TTL de uma chave
   */
  async getTTL(key: string, clientId?: string, prefix?: string): Promise<number> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();
      return await this.client.ttl(cacheKey);
    } catch (error) {
      this.logger.error(`Cache GET_TTL error for ${cacheKey}:`, error);
      return -1;
    }
  }

  /**
   * Definir TTL de uma chave
   */
  async setTTL(key: string, ttl: number, clientId?: string, prefix?: string): Promise<boolean> {
    const cacheKey = this.generateKey(key, clientId, prefix);

    try {
      await this.ensureConnection();
      return await this.client.expire(cacheKey, ttl);
    } catch (error) {
      this.logger.error(`Cache SET_TTL error for ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Obter chaves por padrão
   */
  async getKeys(pattern: string = '*', limit: number = 50, offset: number = 0): Promise<string[]> {
    try {
      await this.ensureConnection();
      const keys = await this.client.keys(pattern);
      return keys.slice(offset, offset + limit);
    } catch (error) {
      this.logger.error(`Cache GET_KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Contar chaves por padrão
   */
  async getKeyCount(pattern: string = '*'): Promise<number> {
    try {
      await this.ensureConnection();
      const keys = await this.client.keys(pattern);
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache GET_KEY_COUNT error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidar por padrão
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      await this.ensureConnection();
      const keys = await this.client.keys(pattern);
      let deletedCount = 0;

      if (keys.length > 0) {
        const pipeline = this.client.multi();
        keys.forEach((key) => pipeline.del(key));
        const results = await pipeline.exec();
        deletedCount = results?.length || 0;
      }

      this.logger.debug(
        `Cache DELETE_PATTERN: ${deletedCount} keys deleted for pattern '${pattern}'`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache DELETE_PATTERN error:`, error);
      return 0;
    }
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<number> {
    try {
      await this.ensureConnection();
      const keys = await this.client.keys('*');

      if (keys.length > 0) {
        const pipeline = this.client.multi();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }

      this.logger.debug(`Cache CLEAR: ${keys.length} keys cleared`);
      return keys.length;
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
      return 0;
    }
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
    // Tentar obter do cache
    const cached = await this.get<T>(key, clientId, config?.prefix);
    if (cached !== null) {
      return cached;
    }

    // Se não estiver em cache, buscar e salvar
    const value = await fetchFn();
    await this.set(key, value, clientId, config);
    return value;
  }

  /**
   * Adicionar chave a tags
   */
  private async addToTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const existingKeys = await this.client.sMembers(tagKey);
        existingKeys.push(cacheKey);
        await this.client.sAdd(tagKey, existingKeys);
        await this.client.expire(tagKey, 86400); // 24 horas
      }
    } catch (error) {
      this.logger.error(`Error adding key to tags:`, error);
    }
  }

  /**
   * Invalidar cache por tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await this.client.sMembers(tagKey);

        if (keys.length > 0) {
          const pipeline = this.client.multi();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }

        await this.client.del(tagKey);
        this.logger.debug(`Invalidated ${keys.length} keys for tag: ${tag}`);
      }
    } catch (error) {
      this.logger.error(`Cache tag invalidation error:`, error);
    }
  }

  /**
   * Incrementar contador
   */
  async increment(key: string, value = 1, clientId?: string): Promise<number> {
    const cacheKey = this.generateKey(key, clientId);

    try {
      await this.ensureConnection();
      return await this.client.incrBy(cacheKey, value);
    } catch (error) {
      this.logger.error(`Cache INCREMENT error for ${cacheKey}:`, error);
      return 0;
    }
  }

  /**
   * Definir múltiplos valores
   */
  async mset(values: Record<string, any>, clientId?: string, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();
      const pipeline = this.client.multi();

      for (const [key, value] of Object.entries(values)) {
        const cacheKey = this.generateKey(key, clientId);
        const entry: CacheEntry = {
          value,
          expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
          ttl,
          createdAt: Date.now(),
        };
        const serialized = this.serialize(entry);

        if (ttl) {
          pipeline.set(cacheKey, serialized, { EX: ttl });
        } else {
          pipeline.set(cacheKey, serialized);
        }
      }

      await pipeline.exec();
      this.logger.debug(`Cache MSET: ${Object.keys(values).length} keys`);
    } catch (error) {
      this.logger.error('Cache MSET error:', error);
      throw error;
    }
  }

  /**
   * Verificar se está conectado
   */
  async isConnected(): Promise<boolean> {
    try {
      return this.client.isReady;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter estatísticas do Redis
   */
  async getStats(): Promise<any> {
    try {
      await this.ensureConnection();
      const info = await this.client.info();
      const keys = await this.client.keys('*');

      return {
        connected: this._isConnected,
        keysCount: keys.length,
        info: info,
      };
    } catch (error) {
      this.logger.error('Error getting Redis stats:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Obter padrões comuns
   */
  async getCommonPatterns(): Promise<{ pattern: string; count: number; examples: string[] }[]> {
    try {
      await this.ensureConnection();
      const allKeys = await this.client.keys('*');

      const patterns = new Map<string, { count: number; examples: string[] }>();

      for (const key of allKeys) {
        const parts = key.split(':');
        if (parts.length > 1) {
          const pattern = `${parts[0]}:*`;
          const current = patterns.get(pattern) || { count: 0, examples: [] };
          current.count++;
          if (current.examples.length < 3) {
            current.examples.push(key);
          }
          patterns.set(pattern, current);
        }
      }

      return Array.from(patterns.entries()).map(([pattern, data]) => ({
        pattern,
        count: data.count,
        examples: data.examples,
      }));
    } catch (error) {
      this.logger.error('Error getting common patterns:', error);
      return [];
    }
  }
}
