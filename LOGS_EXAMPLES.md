# Exemplos de Logs Esperados no Docker - Sistema com Redis/Cache e Logger

## 🐳 Logs no Terminal do Docker

Quando você executar o sistema, verá logs estruturados no terminal do Docker. Aqui estão exemplos do que esperar:

## 📊 Exemplo 1: Dashboard Module

### Acesso: `GET /api/v1/dashboard/stats`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:30:15] [DashboardController] INFO: Iniciando coleta de estatísticas do dashboard para clientId: bemecare
[2024-01-15 10:30:15] [DashboardService] INFO: Iniciando coleta de estatísticas do dashboard para clientId: bemecare
[2024-01-15 10:30:15] [DashboardService] INFO: Cache miss - coletando estatísticas do banco para clientId: bemecare
[2024-01-15 10:30:16] [DashboardService] INFO: Estatísticas do dashboard coletadas e cacheadas com sucesso para clientId: bemecare
[2024-01-15 10:30:16] [DashboardController] INFO: Estatísticas retornadas com sucesso para clientId: bemecare

# Segunda requisição (cache hit):
[2024-01-15 10:30:20] [DashboardController] INFO: Iniciando coleta de estatísticas do dashboard para clientId: bemecare
[2024-01-15 10:30:20] [DashboardService] DEBUG: Estatísticas do dashboard obtidas do cache para clientId: bemecare
[2024-01-15 10:30:20] [DashboardController] INFO: Estatísticas retornadas com sucesso para clientId: bemecare
```

## 🛍️ Exemplo 2: Products Module

### Acesso: `GET /api/v1/products/stats`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:31:00] [ProductsController] INFO: Obtendo estatísticas de produtos para clientId: bemecare
[2024-01-15 10:31:00] [ProductsService] INFO: Obtendo estatísticas de produtos para clientId: bemecare
[2024-01-15 10:31:00] [ProductsService] INFO: Cache miss - coletando estatísticas do banco para clientId: bemecare
[2024-01-15 10:31:01] [ProductsService] INFO: Estatísticas de produtos coletadas e cacheadas com sucesso para clientId: bemecare
[2024-01-15 10:31:01] [ProductsController] INFO: Estatísticas de produtos retornadas com sucesso para clientId: bemecare

# Acesso: GET /api/v1/products/top-selling
[2024-01-15 10:31:30] [ProductsController] INFO: Obtendo produtos mais vendidos para clientId: bemecare
[2024-01-15 10:31:30] [ProductsService] INFO: Obtendo produtos mais vendidos para clientId: bemecare, limit: 5
[2024-01-15 10:31:30] [ProductsService] INFO: Cache miss - coletando produtos mais vendidos do banco para clientId: bemecare
[2024-01-15 10:31:31] [ProductsService] INFO: Produtos mais vendidos coletados e cacheados com sucesso para clientId: bemecare
[2024-01-15 10:31:31] [ProductsController] INFO: Produtos mais vendidos retornados com sucesso para clientId: bemecare
```

## 📅 Exemplo 3: Appointments Module

### Acesso: `GET /api/v1/appointments/calendar`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:32:00] [AppointmentsController] INFO: Obtendo agendamentos do calendário para clientId: bemecare
[2024-01-15 10:32:00] [AppointmentsService] INFO: Obtendo agendamentos do calendário para clientId: bemecare, startDate: 2024-01-01, endDate: 2024-01-31, categoryId: undefined
[2024-01-15 10:32:00] [AppointmentsService] DEBUG: Filtros aplicados: {"clientId":"bemecare"}
[2024-01-15 10:32:01] [AppointmentsService] INFO: Encontrados 15 agendamentos para clientId: bemecare
[2024-01-15 10:32:01] [AppointmentsService] INFO: Agendamentos do calendário retornados com sucesso para clientId: bemecare
[2024-01-15 10:32:01] [AppointmentsController] INFO: Agendamentos do calendário retornados com sucesso para clientId: bemecare

# Acesso: POST /api/v1/appointments (criar agendamento)
[2024-01-15 10:32:30] [AppointmentsController] INFO: Criando agendamento para clientId: bemecare
[2024-01-15 10:32:30] [AppointmentsService] INFO: Criando agendamento para clientId: bemecare, userId: user123, serviceId: service456
[2024-01-15 10:32:30] [AppointmentsService] DEBUG: Dados recebidos: {"startTime":"2024-01-20T14:00:00Z","endTime":"2024-01-20T15:00:00Z","clientId":"bemecare","userId":"user123","serviceId":"service456"}
[2024-01-15 10:32:31] [AppointmentsService] INFO: Agendamento criado com sucesso: apt789 para clientId: bemecare
[2024-01-15 10:32:31] [AppointmentsService] INFO: Agendamento retornado com sucesso para clientId: bemecare
[2024-01-15 10:32:31] [AppointmentsController] INFO: Agendamento criado com sucesso para clientId: bemecare
```

## 🔐 Exemplo 4: Auth Module

### Acesso: `POST /api/v1/auth/login`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:33:00] [AuthController] INFO: Tentativa de login para clientId: bemecare, email: user@example.com
[2024-01-15 10:33:01] [AuthController] INFO: Login realizado com sucesso para email: user@example.com
[2024-01-15 10:33:01] [AuthController] INFO: Login retornado com sucesso para clientId: bemecare

# Acesso: POST /api/v1/auth/register
[2024-01-15 10:33:30] [AuthController] INFO: Tentativa de registro para clientId: bemecare, email: newuser@example.com
[2024-01-15 10:33:31] [AuthController] INFO: Registro realizado com sucesso para email: newuser@example.com
[2024-01-15 10:33:31] [AuthController] INFO: Registro retornado com sucesso para clientId: bemecare
```

## 🏢 Exemplo 5: Services Module

### Acesso: `GET /api/v1/services`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:34:00] [ServicesController] INFO: Listando serviços para clientId: bemecare
[2024-01-15 10:34:00] [ServicesService] INFO: Listando serviços para clientId: bemecare, search: undefined, status: undefined
[2024-01-15 10:34:00] [ServicesService] DEBUG: Pagination: {"page":1,"limit":10}
[2024-01-15 10:34:00] [ServicesService] DEBUG: Filtros aplicados: {"clientId":"bemecare"}
[2024-01-15 10:34:01] [ServicesService] INFO: Encontrados 8 serviços de 8 total para clientId: bemecare
[2024-01-15 10:34:01] [ServicesService] INFO: Serviços retornados com sucesso para clientId: bemecare
[2024-01-15 10:34:01] [ServicesController] INFO: Serviços retornados com sucesso para clientId: bemecare

# Acesso: POST /api/v1/services (criar serviço)
[2024-01-15 10:34:30] [ServicesController] INFO: Criando serviço para clientId: bemecare
[2024-01-15 10:34:30] [ServicesService] INFO: Criando serviço para clientId: bemecare, nome: Consulta Psicológica
[2024-01-15 10:34:30] [ServicesService] DEBUG: Dados recebidos: {"name":"Consulta Psicológica","description":"Consulta individual","price":150,"duration":60}
[2024-01-15 10:34:31] [ServicesService] INFO: Serviço criado com sucesso: svc123 para clientId: bemecare
[2024-01-15 10:34:31] [ServicesService] INFO: Serviço retornado com sucesso para clientId: bemecare
[2024-01-15 10:34:31] [ServicesController] INFO: Serviço criado com sucesso para clientId: bemecare
```

## 🛒 Exemplo 6: Orders Module

### Acesso: `GET /api/v1/orders/stats`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:35:00] [OrdersController] INFO: Obtendo estatísticas de pedidos para clientId: bemecare
[2024-01-15 10:35:00] [OrdersService] INFO: Obtendo estatísticas de pedidos para clientId: bemecare
[2024-01-15 10:35:00] [OrdersService] INFO: Cache miss - coletando estatísticas do banco para clientId: bemecare
[2024-01-15 10:35:01] [OrdersService] INFO: Estatísticas de pedidos coletadas e cacheadas com sucesso para clientId: bemecare
[2024-01-15 10:35:01] [OrdersController] INFO: Estatísticas de pedidos retornadas com sucesso para clientId: bemecare
```

## 👥 Exemplo 7: Clients Module

### Acesso: `GET /api/v1/clients`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:36:00] [ClientsController] INFO: Listando todos os clientes
[2024-01-15 10:36:00] [ClientsService] INFO: Listando clientes para clientId: bemecare
[2024-01-15 10:36:01] [ClientsService] INFO: Encontrados 3 clientes para clientId: bemecare
[2024-01-15 10:36:01] [ClientsController] INFO: Clientes retornados com sucesso para clientId: bemecare

# Acesso: GET /api/v1/clients/by-employee/emp123
[2024-01-15 10:36:30] [ClientsController] INFO: Buscando clientes por funcionário: emp123
[2024-01-15 10:36:30] [ClientsService] INFO: Buscando clientes por funcionário emp123 para clientId: bemecare
[2024-01-15 10:36:31] [ClientsService] INFO: Encontrados 5 clientes para funcionário emp123
[2024-01-15 10:36:31] [ClientsController] INFO: Clientes por funcionário retornados com sucesso para clientId: bemecare
```

## 🏠 Exemplo 8: Properties Module

### Acesso: `GET /api/v1/properties/public`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:37:00] [PropertiesController] INFO: Obtendo propriedades públicas para clientId: bemecare
[2024-01-15 10:37:00] [PropertiesService] INFO: Obtendo propriedades públicas para clientId: bemecare
[2024-01-15 10:37:01] [PropertiesService] INFO: Encontradas 12 propriedades públicas para clientId: bemecare
[2024-01-15 10:37:01] [PropertiesController] INFO: Propriedades públicas retornadas com sucesso para clientId: bemecare

# Acesso: POST /api/v1/properties/prop123/lead
[2024-01-15 10:37:30] [PropertiesController] INFO: Criando lead público para propriedade prop123 em clientId: bemecare
[2024-01-15 10:37:30] [PropertiesService] INFO: Criando lead para propriedade prop123 em clientId: bemecare
[2024-01-15 10:37:31] [PropertiesService] INFO: Lead criado com sucesso: lead456 para propriedade prop123
[2024-01-15 10:37:31] [PropertiesController] INFO: Lead criado com sucesso para clientId: bemecare
```

## 🛍️ Exemplo 9: Ecommerce Module

### Acesso: `GET /api/v1/ecommerce/customers`

```bash
# Logs no terminal do Docker:
[2024-01-15 10:38:00] [CustomersController] INFO: Listando clientes do ecommerce para clientId: bemecare
[2024-01-15 10:38:00] [CustomersService] INFO: Listando clientes do ecommerce para clientId: bemecare
[2024-01-15 10:38:01] [CustomersService] INFO: Encontrados 25 clientes do ecommerce para clientId: bemecare
[2024-01-15 10:38:01] [CustomersController] INFO: Clientes do ecommerce retornados com sucesso para clientId: bemecare

# Acesso: GET /api/v1/ecommerce/cart/user123
[2024-01-15 10:38:30] [CartController] INFO: Obtendo carrinho do usuário user123 para clientId: bemecare
[2024-01-15 10:38:30] [CartService] INFO: Obtendo carrinho do usuário user123 para clientId: bemecare
[2024-01-15 10:38:31] [CartService] INFO: Carrinho encontrado com 3 itens para usuário user123
[2024-01-15 10:38:31] [CartController] INFO: Carrinho retornado com sucesso para clientId: bemecare
```

## ⚠️ Exemplo 10: Logs de Erro

### Erro de Cache

```bash
[2024-01-15 10:39:00] [DashboardService] ERROR: Erro ao coletar estatísticas do dashboard para clientId: bemecare
Error: Redis connection failed
    at RedisService.connect (/app/src/common/cache/redis.service.ts:45:12)
    at DashboardService.getStats (/app/src/modules/dashboard/dashboard.service.ts:25:8)
```

### Erro de Validação

```bash
[2024-01-15 10:39:30] [AppointmentsService] WARN: Conflito de horário detectado para clientId: bemecare
[2024-01-15 10:39:30] [AppointmentsController] ERROR: Erro no agendamento para clientId: bemecare
ConflictException: Conflito de horário: já existe um agendamento neste período
```

### Erro de Banco de Dados

```bash
[2024-01-15 10:40:00] [ProductsService] ERROR: Erro ao obter estatísticas de produtos para clientId: bemecare
PrismaClientKnownRequestError:
Invalid `prisma.product.count()` invocation:
The table `product` does not exist in the current database.
```

## 🔍 Logs de Cache

### Cache Hit (dados do Redis)

```bash
[2024-01-15 10:40:30] [DashboardService] DEBUG: Estatísticas do dashboard obtidas do cache para clientId: bemecare
[2024-01-15 10:40:30] [ProductsService] DEBUG: Produtos mais vendidos obtidos do cache para clientId: bemecare
[2024-01-15 10:40:30] [AppointmentsService] DEBUG: Agendamentos do calendário obtidos do cache para clientId: bemecare
```

### Cache Miss (dados do banco)

```bash
[2024-01-15 10:40:35] [DashboardService] INFO: Cache miss - coletando estatísticas do banco para clientId: bemecare
[2024-01-15 10:40:35] [ProductsService] INFO: Cache miss - coletando produtos mais vendidos do banco para clientId: bemecare
[2024-01-15 10:40:35] [AppointmentsService] INFO: Cache miss - coletando agendamentos do banco para clientId: bemecare
```

## 📊 Logs de Performance

### Tempo de Resposta

```bash
[2024-01-15 10:41:00] [DashboardController] INFO: Estatísticas retornadas em 150ms para clientId: bemecare
[2024-01-15 10:41:00] [ProductsController] INFO: Produtos retornados em 89ms para clientId: bemecare
[2024-01-15 10:41:00] [AppointmentsController] INFO: Agendamentos retornados em 234ms para clientId: bemecare
```

## 🎯 Resumo dos Logs Esperados

### ✅ **Logs Implementados em Todos os Módulos:**

1. **Controller Logs**: Entrada e saída de cada endpoint
2. **Service Logs**: Lógica de negócio e operações de banco
3. **Cache Logs**: Hits, misses e operações de cache
4. **Error Logs**: Tratamento de erros com contexto
5. **Debug Logs**: Informações detalhadas para debugging

### 📋 **Padrão de Logs:**

- **INFO**: Operações normais
- **DEBUG**: Informações detalhadas
- **WARN**: Avisos (conflitos, validações)
- **ERROR**: Erros com stack trace

### 🚀 **Benefícios para Debugging:**

- Rastreamento completo de requisições
- Identificação de gargalos de performance
- Monitoramento de cache hits/misses
- Debugging de erros com contexto completo
