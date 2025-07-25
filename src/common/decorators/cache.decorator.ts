import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';
export const CACHE_TAGS_METADATA = 'cache_tags_metadata';

export interface CacheOptions {
  key?: string;
  ttl?: number;
  tags?: string[];
  prefix?: string;
}

export const Cacheable = (options: CacheOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Armazenar metadados para uso posterior
    SetMetadata(CACHE_KEY_METADATA, options.key || propertyKey)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TAGS_METADATA, options.tags)(target, propertyKey, descriptor);

    return descriptor;
  };
};

export const CacheInvalidate = (pattern: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_invalidate', pattern)(target, propertyKey, descriptor);
    return descriptor;
  };
};

export const CacheClear = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_clear', true)(target, propertyKey, descriptor);
    return descriptor;
  };
};
