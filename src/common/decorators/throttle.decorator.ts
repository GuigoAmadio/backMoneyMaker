import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleConfig {
  limit: number;
  ttl: number;
}

/**
 * Decorator customizado para rate limiting
 * @param limit - Número máximo de requisições
 * @param ttl - Tempo em segundos
 */
export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_KEY, { limit, ttl });

// Presets comuns
export const ThrottleStrict = () => Throttle(5, 60); // 5 req/min
export const ThrottleModerate = () => Throttle(20, 60); // 20 req/min
export const ThrottleRelaxed = () => Throttle(100, 60); // 100 req/min


