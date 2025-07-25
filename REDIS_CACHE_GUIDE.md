# 🚀 Guia de Cache Redis no Backend

## 📋 Visão Geral

O Redis é implementado como uma camada de cache distribuído no backend, oferecendo:

- **Performance**: Cache em memória ultra-rápido
- **Distribuído**: Compartilhado entre múltiplas instâncias
- **Persistente**: Dados sobrevivem a reinicializações
- **Multi-tenant**: Isolamento por client_id
- **Métricas**: Monitoramento completo de performance

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Redis         │
│   (Cache Local) │◄──►│   (Cache Redis) │◄──►│   (Distribuído) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Instalação

### 1. Dependências

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis
```

### 2. Configuração do Docker

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
```

### 3. Variáveis de Ambiente

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
CACHE_TTL=300
CACHE_MAX_ITEMS=1000
```

## 🔧 Configuração

### 1. Módulo de Cache

```typescript
// src/common/cache/cache.module.ts
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: configService.get('CACHE_TTL', 300),
        isGlobal: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService, CacheMetricsService],
  exports: [CacheService, CacheMetricsService],
})
export class RedisCacheModule {}
```

### 2. Importar no AppModule

```typescript
// src/app.module.ts
@Module({
  imports: [
    RedisCacheModule,
    // ... outros módulos
  ],
})
export class AppModule {}
```

## 🎯 Uso Básico

### 1. Injeção do Serviço

```typescript
@Injectable()
export class UsersService {
  constructor(private cacheService: CacheService) {}
}
```

### 2. Operações Básicas

```typescript
// Salvar no cache
await this.cacheService.set('users:list', users, clientId, {
  ttl: 300,
  tags: ['users', 'list'],
});

// Obter do cache
const users = await this.cacheService.get('users:list', clientId);

// Remover do cache
await this.cacheService.delete('users:list', clientId);

// Limpar todo o cache
await this.cacheService.clear();
```

## 🎨 Decorators

### 1. @Cacheable

```typescript
@Get()
@UseInterceptors(CacheInterceptor)
@Cacheable({
  key: 'users:list',
  ttl: 300,
  tags: ['users', 'list']
})
async findAll() {
  return this.usersService.findAll();
}
```

### 2. @CacheInvalidate

```typescript
@Post()
@CacheInvalidate('users:list')
async create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

### 3. @CacheClear

```typescript
@Post('cache/clear')
@CacheClear()
async clearCache() {
  await this.cacheService.invalidateByTags(['users']);
  return { message: 'Cache limpo' };
}
```

## 🔄 Estratégias de Cache

### 1. Cache-First

```typescript
async getUsers(clientId: string) {
  return this.cacheService.getOrSet(
    'users:list',
    () => this.prisma.user.findMany({ where: { clientId } }),
    clientId,
    { ttl: 300, tags: ['users'] }
  );
}
```

### 2. Write-Through

```typescript
async createUser(data: CreateUserDto, clientId: string) {
  const user = await this.prisma.user.create({ data });

  // Atualizar cache imediatamente
  await this.cacheService.set(
    `users:${user.id}`,
    user,
    clientId,
    { ttl: 600, tags: ['users', 'detail'] }
  );

  return user;
}
```

### 3. Write-Behind

```typescript
async updateUser(id: string, data: UpdateUserDto, clientId: string) {
  // Atualizar cache primeiro
  await this.cacheService.set(
    `users:${id}`,
    { ...data, id },
    clientId,
    { ttl: 600 }
  );

  // Atualizar banco em background
  setImmediate(() => {
    this.prisma.user.update({ where: { id }, data });
  });

  return { id, ...data };
}
```

## 📊 Métricas e Monitoramento

### 1. Estatísticas

```typescript
@Get('cache/stats')
async getCacheStats() {
  return this.cacheService.getStats();
}
```

### 2. Métricas Disponíveis

```typescript
{
  hits: 1250,           // Cache hits
  misses: 150,          // Cache misses
  sets: 200,            // Operações de escrita
  deletes: 50,          // Operações de remoção
  errors: 5,            // Erros
  totalRequests: 1400,  // Total de requisições
  hitRate: 89.29,       // Taxa de acerto (%)
  averageHitTime: 2.5,  // Tempo médio de hit (ms)
  averageSetTime: 15.2  // Tempo médio de set (ms)
}
```

## 🏢 Multi-Tenancy

### 1. Isolamento por Client

```typescript
// Chaves são automaticamente prefixadas com client_id
await this.cacheService.set('users:list', users, 'client-123');
// Resultado: client:client-123:users:list
```

### 2. Invalidação por Tenant

```typescript
// Invalidar apenas cache do tenant específico
await this.cacheService.invalidatePattern('users:list', 'client-123');
```

## 🔒 Segurança

### 1. Isolamento de Dados

- Cada tenant tem seu próprio namespace
- Chaves são prefixadas com client_id
- Sem vazamento de dados entre tenants

### 2. TTL Configurável

```typescript
// Dados sensíveis com TTL curto
await this.cacheService.set('auth:token', token, clientId, { ttl: 60 });

// Dados públicos com TTL longo
await this.cacheService.set('config:settings', settings, clientId, { ttl: 3600 });
```

## 🚀 Performance

### 1. Otimizações

```typescript
// Cache em lote
await this.cacheService.mset(
  {
    'users:list': users,
    'users:count': count,
    'users:stats': stats,
  },
  clientId,
);

// Incremento atômico
const viewCount = await this.cacheService.increment('page:views', 1, clientId);
```

### 2. Padrões de Chave

```typescript
// Estrutura hierárquica
users:list:page:1:limit:10
users:detail:123
users:stats:dashboard
appointments:today:client:456
```

## 🔧 Manutenção

### 1. Limpeza Automática

```typescript
// Limpar cache expirado
@Cron('0 2 * * *') // 2 AM diariamente
async cleanExpiredCache() {
  // Redis faz isso automaticamente
}
```

### 2. Backup

```typescript
// Backup do cache
@Cron('0 1 * * *') // 1 AM diariamente
async backupCache() {
  // Implementar backup se necessário
}
```

## 🐛 Debug

### 1. Logs Detalhados

```typescript
// Habilitar logs de debug
this.logger.debug(`Cache HIT: ${key} (${duration}ms)`);
this.logger.debug(`Cache MISS: ${key}`);
this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
```

### 2. Monitoramento

```typescript
// Endpoint de health check
@Get('health/cache')
async cacheHealth() {
  const stats = this.cacheService.getStats();
  return {
    status: stats.errors > 10 ? 'unhealthy' : 'healthy',
    stats
  };
}
```

## 📈 Benefícios

1. **Performance**: Redução de 80-90% no tempo de resposta
2. **Escalabilidade**: Suporte a múltiplas instâncias
3. **Confiabilidade**: Persistência de dados
4. **Monitoramento**: Métricas detalhadas
5. **Multi-tenant**: Isolamento completo
6. **Flexibilidade**: TTL e tags configuráveis

## 🎯 Próximos Passos

1. Implementar cache em todos os endpoints críticos
2. Configurar monitoramento em produção
3. Implementar cache warming
4. Adicionar cache de sessões
5. Implementar rate limiting com Redis
