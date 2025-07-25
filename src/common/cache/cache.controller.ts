import { Controller, Get, Delete, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheMetricsService } from './cache-metrics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/enums/user-role.enum';

interface InvalidateCacheDto {
  pattern?: string;
  keys?: string[];
}

interface CacheStatsResponse {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  clears: number;
  totalRequests: number;
  hitRate: number;
  averageHitTime: number;
  averageSetTime: number;
}

interface CacheKeyInfo {
  key: string;
  ttl: number;
  size: string;
}

@Controller('cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CacheController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheMetricsService: CacheMetricsService,
  ) {}

  @Get('stats')
  async getCacheStats(): Promise<CacheStatsResponse> {
    const stats = await this.cacheMetricsService.getStats();
    return stats;
  }

  @Get('keys')
  async getCacheKeys(
    @Query('pattern') pattern?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ keys: CacheKeyInfo[]; total: number }> {
    const keys = await this.cacheService.getKeys(pattern || '*', limit || 50, offset || 0);
    const total = await this.cacheService.getKeyCount(pattern || '*');

    const keyInfos: CacheKeyInfo[] = [];

    for (const key of keys) {
      const ttl = await this.cacheService.getTTL(key);
      const size = await this.cacheService.getKeySize(key);

      keyInfos.push({
        key,
        ttl,
        size,
      });
    }

    return {
      keys: keyInfos,
      total,
    };
  }

  @Get('keys/:key')
  async getKeyInfo(@Param('key') key: string): Promise<CacheKeyInfo> {
    const ttl = await this.cacheService.getTTL(key);
    const size = await this.cacheService.getKeySize(key);

    return {
      key,
      ttl,
      size,
    };
  }

  @Delete('keys/:key')
  async invalidateKey(@Param('key') key: string): Promise<{ success: boolean; message: string }> {
    await this.cacheService.delete(key);
    return {
      success: true,
      message: `Key '${key}' invalidated successfully`,
    };
  }

  @Post('invalidate')
  async invalidatePattern(
    @Body() dto: InvalidateCacheDto,
  ): Promise<{ success: boolean; message: string; invalidatedCount: number }> {
    let invalidatedCount = 0;

    if (dto.keys && dto.keys.length > 0) {
      // Invalidar chaves específicas
      for (const key of dto.keys) {
        await this.cacheService.delete(key);
        invalidatedCount++;
      }

      return {
        success: true,
        message: `Invalidated ${invalidatedCount} specific keys`,
        invalidatedCount,
      };
    }

    if (dto.pattern) {
      // Invalidar por padrão
      invalidatedCount = await this.cacheService.deletePattern(dto.pattern);

      return {
        success: true,
        message: `Invalidated ${invalidatedCount} keys matching pattern '${dto.pattern}'`,
        invalidatedCount,
      };
    }

    return {
      success: false,
      message: 'No keys or pattern provided',
      invalidatedCount: 0,
    };
  }

  @Delete('clear')
  async clearAllCache(): Promise<{ success: boolean; message: string; clearedCount: number }> {
    const clearedCount = await this.cacheService.clear();

    return {
      success: true,
      message: `Cleared all cache (${clearedCount} keys)`,
      clearedCount,
    };
  }

  @Post('keys/:key/ttl')
  async setKeyTTL(
    @Param('key') key: string,
    @Body() body: { ttl: number },
  ): Promise<{ success: boolean; message: string }> {
    const success = await this.cacheService.setTTL(key, body.ttl);

    return {
      success,
      message: success
        ? `TTL for key '${key}' set to ${body.ttl} seconds`
        : `Failed to set TTL for key '${key}'`,
    };
  }

  @Get('health')
  async getCacheHealth(): Promise<{
    status: string;
    connected: boolean;
    memory: string;
    keys: number;
  }> {
    const connected = await this.cacheService.isConnected();
    const memory = await this.cacheService.getMemoryUsage();
    const keys = await this.cacheService.getKeyCount();

    return {
      status: connected ? 'healthy' : 'unhealthy',
      connected,
      memory,
      keys,
    };
  }

  @Get('patterns')
  async getCommonPatterns(): Promise<{ pattern: string; count: number; examples: string[] }[]> {
    const patterns = await this.cacheService.getCommonPatterns();
    return patterns;
  }
}
