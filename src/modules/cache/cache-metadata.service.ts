import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheMetadata } from '@prisma/client';

@Injectable()
export class CacheMetadataService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ Obter metadata de cache específico
   */
  async getCacheMetadata(clientId: string, cacheKey: string): Promise<CacheMetadata | null> {
    try {
      console.log(
        `🔍 [CacheMetadata] Buscando metadata - clientId: ${clientId}, cacheKey: ${cacheKey}`,
      );

      const metadata = await this.prisma.cacheMetadata.findUnique({
        where: {
          clientId_cacheKey: {
            clientId,
            cacheKey,
          },
        },
      });

      if (metadata) {
        console.log(
          `✅ [CacheMetadata] Metadata encontrada - lastUpdated: ${metadata.lastUpdated}, hitCount: ${metadata.hitCount}`,
        );
      } else {
        console.log(`❌ [CacheMetadata] Metadata não encontrada para ${cacheKey}`);
      }

      return metadata;
    } catch (error) {
      console.error(`❌ [CacheMetadata] Erro ao obter cache metadata ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * ✅ Obter todos os metadata de cache do cliente
   */
  async getAllCacheMetadata(clientId: string): Promise<CacheMetadata[]> {
    try {
      return await this.prisma.cacheMetadata.findMany({
        where: { clientId },
        orderBy: { lastUpdated: 'desc' },
      });
    } catch (error) {
      console.error('Erro ao obter todos os cache metadata:', error);
      return [];
    }
  }

  /**
   * ✅ Criar novo metadata de cache
   */
  async createCacheMetadata(
    clientId: string,
    cacheKey: string,
    version?: string,
    dataSize?: number,
  ): Promise<CacheMetadata> {
    try {
      return await this.prisma.cacheMetadata.create({
        data: {
          clientId,
          cacheKey,
          lastUpdated: new Date(),
          version,
          dataSize,
          hitCount: 0,
        },
      });
    } catch (error) {
      console.error(`Erro ao criar cache metadata ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * ✅ Atualizar metadata de cache (marcar como atualizado)
   */
  async updateCacheMetadata(
    clientId: string,
    cacheKey: string,
    version?: string,
    dataSize?: number,
  ): Promise<CacheMetadata> {
    try {
      console.log(
        `🔄 [CacheMetadata] Atualizando metadata - clientId: ${clientId}, cacheKey: ${cacheKey}`,
      );
      console.log(`📊 [CacheMetadata] Dados: version=${version}, dataSize=${dataSize}`);

      const result = await this.prisma.cacheMetadata.upsert({
        where: {
          clientId_cacheKey: {
            clientId,
            cacheKey,
          },
        },
        update: {
          lastUpdated: new Date(),
          version,
          dataSize,
        },
        create: {
          clientId,
          cacheKey,
          lastUpdated: new Date(),
          version,
          dataSize,
          hitCount: 0,
        },
      });

      console.log(
        `✅ [CacheMetadata] Metadata atualizada com sucesso - ID: ${result.id}, lastUpdated: ${result.lastUpdated}`,
      );
      return result;
    } catch (error) {
      console.error(`❌ [CacheMetadata] Erro ao atualizar cache metadata ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * ✅ Incrementar contador de hits
   */
  async incrementHitCount(clientId: string, cacheKey: string): Promise<void> {
    try {
      await this.prisma.cacheMetadata.updateMany({
        where: {
          clientId,
          cacheKey,
        },
        data: {
          hitCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error(`Erro ao incrementar hit count ${cacheKey}:`, error);
      // Não falhar se não conseguir incrementar
    }
  }

  /**
   * ✅ Invalidar caches por padrão
   */
  async invalidateCachePattern(clientId: string, pattern: string): Promise<number> {
    try {
      console.log(
        `🗑️ [CacheMetadata] Invalidando pattern - clientId: ${clientId}, pattern: ${pattern}`,
      );

      const result = await this.prisma.cacheMetadata.updateMany({
        where: {
          clientId,
          cacheKey: {
            contains: pattern,
          },
        },
        data: {
          lastUpdated: new Date(),
        },
      });

      console.log(`✅ [CacheMetadata] ${result.count} caches invalidados com padrão: ${pattern}`);
      return result.count;
    } catch (error) {
      console.error(`❌ [CacheMetadata] Erro ao invalidar cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * ✅ Obter estatísticas de cache
   */
  async getCacheStats(clientId: string): Promise<{
    totalCaches: number;
    totalHits: number;
    avgHitsPerCache: number;
    mostAccessedCaches: Array<{ cacheKey: string; hitCount: number }>;
    recentlyUpdated: Array<{ cacheKey: string; lastUpdated: Date }>;
  }> {
    try {
      const allCaches = await this.prisma.cacheMetadata.findMany({
        where: { clientId },
        select: {
          cacheKey: true,
          hitCount: true,
          lastUpdated: true,
        },
      });

      const totalCaches = allCaches.length;
      const totalHits = allCaches.reduce((sum, cache) => sum + cache.hitCount, 0);
      const avgHitsPerCache = totalCaches > 0 ? Math.round(totalHits / totalCaches) : 0;

      const mostAccessedCaches = allCaches
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 5)
        .map((cache) => ({
          cacheKey: cache.cacheKey,
          hitCount: cache.hitCount,
        }));

      const recentlyUpdated = allCaches
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, 5)
        .map((cache) => ({
          cacheKey: cache.cacheKey,
          lastUpdated: cache.lastUpdated,
        }));

      return {
        totalCaches,
        totalHits,
        avgHitsPerCache,
        mostAccessedCaches,
        recentlyUpdated,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de cache:', error);
      return {
        totalCaches: 0,
        totalHits: 0,
        avgHitsPerCache: 0,
        mostAccessedCaches: [],
        recentlyUpdated: [],
      };
    }
  }

  /**
   * ✅ Limpar caches antigos (opcional - para manutenção)
   */
  async cleanupOldCaches(clientId: string, olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.cacheMetadata.deleteMany({
        where: {
          clientId,
          lastUpdated: {
            lt: cutoffDate,
          },
          hitCount: 0, // Só deletar caches que nunca foram acessados
        },
      });

      console.log(`✅ [Cache] ${result.count} caches antigos removidos`);
      return result.count;
    } catch (error) {
      console.error('Erro ao limpar caches antigos:', error);
      return 0;
    }
  }
}
