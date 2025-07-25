# Cache Controller - Guia de Uso

O `CacheController` fornece uma interface REST para gerenciar o cache Redis via API. Todos os endpoints requerem autenticação e permissão de ADMIN.

## Endpoints Disponíveis

### 1. Estatísticas do Cache

```http
GET /cache/stats
```

**Resposta:**

```json
{
  "totalKeys": 150,
  "memoryUsage": "2.5 MB",
  "hitRate": 0.85,
  "missRate": 0.15,
  "totalHits": 1250,
  "totalMisses": 220,
  "averageResponseTime": 2.3,
  "topKeys": [
    {
      "key": "user:123",
      "hits": 45,
      "lastAccessed": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. Listar Chaves do Cache

```http
GET /cache/keys?pattern=user:*&limit=20&offset=0
```

**Parâmetros:**

- `pattern`: Padrão de busca (ex: `user:*`, `*:123`, `*`)
- `limit`: Número máximo de chaves (padrão: 50)
- `offset`: Deslocamento para paginação (padrão: 0)

**Resposta:**

```json
{
  "keys": [
    {
      "key": "user:123",
      "ttl": 240,
      "size": "1.2 KB",
      "lastAccessed": "2024-01-15T10:30:00.000Z",
      "hitCount": 45
    }
  ],
  "total": 150
}
```

### 3. Informações de uma Chave Específica

```http
GET /cache/keys/user:123
```

**Resposta:**

```json
{
  "key": "user:123",
  "ttl": 240,
  "size": "1.2 KB",
  "lastAccessed": "2024-01-15T10:30:00.000Z",
  "hitCount": 45
}
```

### 4. Invalidar Chave Específica

```http
DELETE /cache/keys/user:123
```

**Resposta:**

```json
{
  "success": true,
  "message": "Key 'user:123' invalidated successfully"
}
```

### 5. Invalidar por Padrão ou Chaves Específicas

```http
POST /cache/invalidate
Content-Type: application/json

{
  "pattern": "user:*"
}
```

**Ou invalidar chaves específicas:**

```json
{
  "keys": ["user:123", "user:456", "appointment:789"]
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Invalidated 25 keys matching pattern 'user:*'",
  "invalidatedCount": 25
}
```

### 6. Limpar Todo o Cache

```http
DELETE /cache/clear
```

**Resposta:**

```json
{
  "success": true,
  "message": "Cleared all cache (150 keys)",
  "clearedCount": 150
}
```

### 7. Definir TTL de uma Chave

```http
POST /cache/keys/user:123/ttl
Content-Type: application/json

{
  "ttl": 600
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "TTL for key 'user:123' set to 600 seconds"
}
```

### 8. Health Check do Cache

```http
GET /cache/health
```

**Resposta:**

```json
{
  "status": "healthy",
  "connected": true,
  "memory": "2.5 MB",
  "keys": 150
}
```

### 9. Padrões Comuns

```http
GET /cache/patterns
```

**Resposta:**

```json
[
  {
    "pattern": "user:*",
    "count": 50,
    "examples": ["user:123", "user:456", "user:789"]
  },
  {
    "pattern": "appointment:*",
    "count": 30,
    "examples": ["appointment:001", "appointment:002"]
  }
]
```

## Exemplos de Uso

### Invalidar Cache de Usuários

```bash
curl -X POST http://localhost:3000/cache/invalidate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "user:*"}'
```

### Limpar Cache de Agendamentos

```bash
curl -X POST http://localhost:3000/cache/invalidate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "appointment:*"}'
```

### Verificar Estatísticas

```bash
curl -X GET http://localhost:3000/cache/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Listar Chaves de um Cliente Específico

```bash
curl -X GET "http://localhost:3000/cache/keys?pattern=client:123:*&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Casos de Uso Comuns

### 1. Monitoramento de Performance

- Use `/cache/stats` para monitorar hit rate e performance
- Configure alertas para hit rate baixo (< 0.7)
- Monitore uso de memória

### 2. Debug de Cache

- Use `/cache/keys` para ver chaves ativas
- Use `/cache/keys/:key` para detalhes de uma chave
- Use `/cache/patterns` para entender padrões de uso

### 3. Manutenção

- Use `/cache/invalidate` para limpar cache específico
- Use `/cache/clear` para limpeza completa
- Use `/cache/health` para verificar conectividade

### 4. Otimização

- Use `/cache/keys` para identificar chaves grandes
- Use `/cache/patterns` para identificar padrões ineficientes
- Ajuste TTL com `/cache/keys/:key/ttl`

## Segurança

- Todos os endpoints requerem autenticação JWT
- Apenas usuários com role `ADMIN` podem acessar
- Logs detalhados são mantidos para auditoria
- Não expõe dados sensíveis (apenas metadados)

## Performance

- Endpoints são otimizados para resposta rápida
- Paginação implementada para grandes datasets
- Cache de métricas para reduzir overhead
- Timeouts configurados para evitar travamentos

## Monitoramento

O controller gera logs detalhados para:

- Acessos aos endpoints
- Operações de invalidação
- Erros e exceções
- Performance de cada operação

## Integração com Frontend

Você pode criar uma interface de administração no frontend para:

- Visualizar estatísticas em tempo real
- Gerenciar cache via interface gráfica
- Configurar alertas e notificações
- Monitorar performance do sistema
