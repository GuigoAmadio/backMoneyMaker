# 🧪 Guia Completo de Testes - Money Maker Backend

Este guia explica como testar todas as tecnologias implementadas no backend e verificar se estão funcionando corretamente.

## 📋 Tecnologias Testadas

1. **🔄 Cache Redis** - Sistema de cache em memória
2. **📊 Sistema de Filas (Bull)** - Processamento assíncrono
3. **📱 Notificações Telegram** - Alertas em tempo real
4. **📈 Métricas Prometheus** - Monitoramento e observabilidade
5. **🗄️ Banco de Dados (Prisma)** - Persistência de dados
6. **📝 Logs Winston** - Sistema de logging estruturado
7. **🏢 Multi-Tenancy** - Sistema multi-cliente
8. **⚡ Performance** - Testes de velocidade e eficiência

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Docker rodando** com os serviços:

   ```bash
   docker-compose up -d
   ```

2. **Dependências instaladas**:

   ```bash
   npm install
   ```

3. **Banco de dados migrado**:
   ```bash
   npm run prisma:migrate
   ```

### Comandos de Teste

#### 1. Teste Completo de Health Check

```bash
npm run test:health
```

**O que testa:**

- ✅ Conectividade básica do servidor
- ✅ Conexão com banco de dados
- ✅ Cache Redis funcionando
- ✅ Sistema de filas operacional
- ✅ Logs Winston ativos
- ✅ Métricas Prometheus disponíveis
- ✅ Sistema multi-tenant configurado
- ✅ Performance adequada

#### 2. Teste Específico do Redis

```bash
npm run test:redis
```

**O que testa:**

- ✅ Conexão com Redis
- ✅ Operações de cache (set/get/del)
- ✅ Expiração automática de chaves
- ✅ Performance do cache

#### 3. Teste do Sistema de Filas

```bash
npm run test:queue
```

**O que testa:**

- ✅ Conexão com Redis para filas
- ✅ Adição de jobs (simples, com prioridade, com delay)
- ✅ Processamento de jobs
- ✅ Estatísticas da fila
- ✅ Limpeza de jobs antigos
- ✅ Performance de processamento

#### 4. Teste das Notificações Telegram

```bash
npm run test:telegram
```

**O que testa:**

- ✅ Configuração do bot
- ✅ Formatação de mensagens (erro, sucesso, warning, info)
- ✅ Alertas específicos (servidor down, alta taxa de erro, etc.)
- ✅ Alertas customizados
- ✅ Integração com filas
- ✅ Performance de envio
- ✅ Tratamento de erros

#### 5. Teste das Métricas Prometheus

```bash
npm run test:metrics
```

**O que testa:**

- ✅ Endpoint `/metrics` disponível
- ✅ Formato Prometheus correto
- ✅ Métricas de requisições HTTP
- ✅ Métricas de performance (CPU, memória)
- ✅ Métricas customizadas
- ✅ Performance do endpoint

#### 6. Todos os Testes

```bash
npm run test:all
```

Executa todos os testes de uma vez.

#### 7. Teste de Integração

```bash
npm run test:integration
```

Teste completo que verifica a integração entre todas as tecnologias.

## 📊 Como Interpretar os Resultados

### ✅ Testes Passando

```
✅ Servidor respondendo na porta correta
✅ Conexão com banco de dados estabelecida
✅ Redis conectado com sucesso
✅ Fila Bull conectada ao Redis
✅ Job processado com sucesso
✅ Logs gerados com sucesso
✅ Endpoint de métricas funcionando
✅ Header x-client-id processado
✅ Tempo de resposta: 45ms
```

### ⚠️ Testes com Avisos

```
⚠️ Bot Telegram configurado mas não testado (sem token válido)
⚠️ Telegram não configurado: Invalid token
```

**O que significa:** A funcionalidade está configurada mas não pode ser testada completamente (normal se não tiver token do Telegram).

### ❌ Testes Falhando

```
❌ Erro na conexão com banco: Connection refused
❌ Erro na conexão com Redis: ECONNREFUSED
❌ Erro no teste de fila: Queue not ready
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps

# Verificar logs do banco
docker-compose logs postgres

# Recriar o banco se necessário
docker-compose down
docker-compose up -d
npm run prisma:migrate
```

#### 2. Erro de Conexão com Redis

```bash
# Verificar se o Redis está rodando
docker-compose ps

# Verificar logs do Redis
docker-compose logs redis

# Recriar o Redis se necessário
docker-compose down
docker-compose up -d
```

#### 3. Erro de Dependências

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Docker
docker system prune -f
docker-compose up --build
```

#### 4. Erro de Porta em Uso

```bash
# Verificar processos na porta
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Matar processos se necessário
kill -9 <PID>
```

## 📈 Monitoramento em Produção

### Endpoints de Health Check

1. **Health Check Básico:**

   ```
   GET /health
   ```

2. **Métricas Prometheus:**

   ```
   GET /metrics
   ```

3. **Status do Telegram:**

   ```
   GET /notifications/telegram/status
   ```

4. **Teste do Telegram:**
   ```
   POST /notifications/telegram/test
   ```

### Logs Importantes

Procure por estes padrões nos logs:

```bash
# Logs de sucesso
✅ [HealthCheck] Todas as tecnologias funcionando
✅ [Redis] Cache operacional
✅ [Queue] Jobs processados com sucesso
✅ [Telegram] Notificação enviada

# Logs de erro
❌ [Database] Erro de conexão
❌ [Redis] Timeout de conexão
❌ [Queue] Job falhou
❌ [Telegram] Token inválido
```

## 🎯 Checklist de Verificação

### Antes de Executar os Testes

- [ ] Docker rodando
- [ ] Serviços PostgreSQL e Redis ativos
- [ ] Dependências instaladas
- [ ] Migrações aplicadas
- [ ] Variáveis de ambiente configuradas

### Durante os Testes

- [ ] Todos os testes passando
- [ ] Performance adequada (< 1s para health check)
- [ ] Logs sendo gerados
- [ ] Métricas sendo registradas
- [ ] Cache funcionando
- [ ] Filas processando jobs

### Após os Testes

- [ ] Verificar logs de erro
- [ ] Confirmar métricas no endpoint `/metrics`
- [ ] Testar endpoints manualmente
- [ ] Verificar performance em produção

## 🚀 Próximos Passos

1. **Configurar Monitoramento:**

   - Grafana para visualização de métricas
   - Alertas automáticos
   - Dashboards de performance

2. **Implementar Testes E2E:**

   - Testes de fluxos completos
   - Testes de carga
   - Testes de segurança

3. **Automatizar Testes:**
   - CI/CD pipeline
   - Testes automáticos em deploy
   - Relatórios de cobertura

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs:** `docker-compose logs -f`
2. **Verificar status:** `docker-compose ps`
3. **Recriar serviços:** `docker-compose down && docker-compose up -d`
4. **Limpar cache:** `docker system prune -f`

---

**🎉 Parabéns!** Se todos os testes passaram, seu backend está funcionando perfeitamente com todas as tecnologias implementadas!
