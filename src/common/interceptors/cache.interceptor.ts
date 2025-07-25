import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../cache/redis.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_TAGS_METADATA,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['client-id'] || request.user?.clientId;

    // Verificar se o método tem cache habilitado
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());
    const cacheTags = this.reflector.get<string[]>(CACHE_TAGS_METADATA, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    // Gerar chave de cache baseada no método e parâmetros
    const methodKey = this.generateMethodKey(context, cacheKey);

    // Tentar obter do cache
    const cachedValue = await this.redisService.get(methodKey, clientId);

    if (cachedValue) {
      return of(cachedValue);
    }

    // Se não estiver em cache, executar método e salvar resultado
    return next.handle().pipe(
      tap(async (data) => {
        if (data) {
          await this.redisService.set(methodKey, data, clientId, {
            ttl: cacheTTL,
            tags: cacheTags,
          });
        }
      }),
    );
  }

  private generateMethodKey(context: ExecutionContext, baseKey: string): string {
    const request = context.switchToHttp().getRequest();
    const { params, query, body } = request;

    // Incluir parâmetros relevantes na chave
    const paramsString = JSON.stringify({
      params: params || {},
      query: query || {},
      // Não incluir body completo para evitar chaves muito longas
      bodyKeys: body ? Object.keys(body) : [],
    });

    return `${baseKey}:${this.hashString(paramsString)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
