import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CacheMetadataService } from './cache-metadata.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

interface UpdateCacheMetadataDto {
  cacheKey: string;
  version?: string;
  dataSize?: number;
}

@Controller('cache')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CacheMetadataController {
  constructor(private readonly cacheMetadataService: CacheMetadataService) {}

  /**
   * ✅ Obter metadata de cache específico
   */
  @Get('metadata/:key')
  async getCacheMetadata(@Param('key') key: string, @Request() req: any) {
    try {
      const clientId = req.clientId;

      if (!clientId) {
        throw new HttpException('Client ID não encontrado', HttpStatus.BAD_REQUEST);
      }

      const metadata = await this.cacheMetadataService.getCacheMetadata(clientId, key);

      if (!metadata) {
        // Se não existe, criar com timestamp atual
        const newMetadata = await this.cacheMetadataService.createCacheMetadata(clientId, key);

        return {
          success: true,
          data: {
            cache_key: newMetadata.cacheKey,
            last_updated: newMetadata.lastUpdated,
            version: newMetadata.version,
            hit_count: newMetadata.hitCount,
          },
        };
      }

      // Incrementar hit count
      await this.cacheMetadataService.incrementHitCount(clientId, key);

      return {
        success: true,
        data: {
          cache_key: metadata.cacheKey,
          last_updated: metadata.lastUpdated,
          version: metadata.version,
          hit_count: metadata.hitCount,
        },
      };
    } catch (error) {
      console.error('Erro ao obter cache metadata:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Obter todos os metadata de cache do cliente
   */
  @Get('metadata')
  async getAllCacheMetadata(@Request() req: any) {
    try {
      const clientId = req.clientId;

      if (!clientId) {
        throw new HttpException('Client ID não encontrado', HttpStatus.BAD_REQUEST);
      }

      const allMetadata = await this.cacheMetadataService.getAllCacheMetadata(clientId);

      return {
        success: true,
        data: allMetadata.map((metadata) => ({
          cache_key: metadata.cacheKey,
          last_updated: metadata.lastUpdated,
          version: metadata.version,
          hit_count: metadata.hitCount,
          data_size: metadata.dataSize,
        })),
      };
    } catch (error) {
      console.error('Erro ao obter todos os cache metadata:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Atualizar metadata de cache (marcar como atualizado)
   */
  @Post('metadata/update')
  async updateCacheMetadata(@Body() data: UpdateCacheMetadataDto, @Request() req: any) {
    try {
      const clientId = req.clientId;

      if (!clientId) {
        throw new HttpException('Client ID não encontrado', HttpStatus.BAD_REQUEST);
      }

      if (!data.cacheKey) {
        throw new HttpException('Cache key é obrigatório', HttpStatus.BAD_REQUEST);
      }

      await this.cacheMetadataService.updateCacheMetadata(
        clientId,
        data.cacheKey,
        data.version,
        data.dataSize,
      );

      return {
        success: true,
        message: `Cache metadata atualizada para: ${data.cacheKey}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao atualizar cache metadata:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Invalidar múltiplos caches por padrão
   */
  @Post('metadata/invalidate')
  async invalidateCachePattern(@Body() data: { pattern: string }, @Request() req: any) {
    try {
      const clientId = req.clientId;

      if (!clientId) {
        throw new HttpException('Client ID não encontrado', HttpStatus.BAD_REQUEST);
      }

      if (!data.pattern) {
        throw new HttpException('Pattern é obrigatório', HttpStatus.BAD_REQUEST);
      }

      const invalidatedCount = await this.cacheMetadataService.invalidateCachePattern(
        clientId,
        data.pattern,
      );

      return {
        success: true,
        message: `${invalidatedCount} caches invalidados com padrão: ${data.pattern}`,
        invalidated_count: invalidatedCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao invalidar cache pattern:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * ✅ Obter estatísticas de cache
   */
  @Get('stats')
  async getCacheStats(@Request() req: any) {
    try {
      const clientId = req.clientId;

      if (!clientId) {
        throw new HttpException('Client ID não encontrado', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.cacheMetadataService.getCacheStats(clientId);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de cache:', error);
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
