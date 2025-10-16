<!-- b887f263-d2c7-4eb3-8d92-10862cdad124 309f5dfa-9f38-454b-8ca6-75969b329e09 -->
# Plano: Finalizar UltraDashboard Completo

## Fase 1: Autenticação Robusta (Backend + Frontend)

### Backend

**Arquivos:** `backend/src/modules/auth/`

- Implementar refresh token automático
- Adicionar rota `POST /auth/refresh` funcional
- Atualizar `auth.service.ts` para gerar e validar refresh tokens
- Limpar tokens expirados periodicamente

- Sistema de recuperação de senha
- `POST /auth/forgot-password` - gera token e envia email
- `POST /auth/reset-password` - valida token e atualiza senha
- Integrar com serviço de email (nodemailer ou similar)

- Verificação de email
- Enviar email de confirmação no registro
- Rota `GET /auth/verify-email/:token`

### Frontend

**Arquivos:** `ultradashboard/src/`

- `actions/auth.ts` - adicionar funções de refresh, forgot/reset password
- `context/AuthContext.tsx` - implementar auto-refresh de token
- `app/forgot-password/page.tsx` - criar página de recuperação
- `app/reset-password/page.tsx` - criar página de reset
- Interceptor axios para renovar token automaticamente em 401

---

## Fase 2: Integração Stripe Completa

### Backend

**Arquivos:** `backend/src/modules/stripe/`

- Expandir `stripe.service.ts` com:
- Criar produtos/prices para cada serviço
- Checkout session com trial de 30 dias
- Webhooks para eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

- Webhook handler em `stripe.controller.ts`:
- Ativar serviços no campo `activeServices` do Client ao confirmar pagamento
- Desativar serviços quando subscription é cancelada
- Atualizar status do cliente (TRIAL, ACTIVE, SUSPENDED)

- Adicionar no schema Prisma (se necessário):
- `subscriptionId` no model Client
- `subscriptionStatus` (active, canceled, past_due)

### Frontend

**Arquivos:** `ultradashboard/src/`

- `app/register/page.tsx` - adicionar seleção de serviços
- Checkboxes para Finance, Calendar, Appointments, etc.
- Calcular preço total baseado nos serviços selecionados
- Mostrar trial de 30 dias

- `actions/stripe.ts` - criar checkout session
- `app/checkout/page.tsx` - tela de checkout (redireciona para Stripe)
- `app/checkout/success/page.tsx` - confirmar sucesso e redirecionar ao dashboard
- `app/checkout/cancel/page.tsx` - mensagem de cancelamento

---

## Fase 3: Landing Page Profissional

### Estrutura

**Arquivo:** `ultradashboard/src/app/page.tsx`

Criar seções:

1. **Hero Section**

- Headline impactante
- Subheadline com proposta de valor
- CTA principal (Começar Trial Grátis)
- Visual: SVG/componente animado mostrando dashboard

2. **Features Section**

- Grid com 6-8 features principais
- Ícones animados (Lucide icons + Framer Motion)
- Descrições curtas e objetivas

3. **Services/Modules Section**

- Cards para cada serviço (Finance, Calendar, etc.)
- Mockup visual de cada módulo
- Toggle para ver preços

4. **Pricing Section**

- 3 tiers: Starter, Professional, Enterprise
- Destaque para trial de 30 dias
- Lista de serviços incluídos em cada tier
- Botão para escolher plano

5. **Social Proof (opcional se houver tempo)**

- Depoimentos simulados
- Logos de "empresas" (pode usar placeholders)

6. **Footer**

- Links rápidos
- Contato
- Social media

### Componentes a criar

**Pasta:** `ultradashboard/src/components/landing/`

- `Hero.tsx` - Hero section com animações
- `Features.tsx` - Grid de features
- `ServicesShowcase.tsx` - Showcasing módulos
- `PricingTiers.tsx` - Cards de pricing
- `DashboardPreview.tsx` - Componente SVG/visual do dashboard
- `AnimatedStats.tsx` - Números animados (usuários, requests, etc.)
- `Footer.tsx` - Footer completo

### Estilos e animações

- Usar Framer Motion para animações de entrada
- Gradient backgrounds modernos
- Color grading consistente (baseado no tema atual)
- Responsivo mobile-first

---

## Fase 4: Conectar Frontend com Backend Real

### Remover Mock Data e conectar APIs reais

**Finance Module:**

- `src/components/services/finance/FinanceService.tsx`
- Conectar com `backend/src/modules/finances/`
- Garantir CRUD de transactions, workspaces, goals, budgets

**Calendar Module:**

- Criar `src/components/services/calendar/CalendarService.tsx`
- Conectar com `backend/src/modules/schedule/`
- Implementar visualização mensal/semanal/diária
- CRUD de eventos

**Appointments Module:**

- `src/components/services/appointments/AppointmentsService.tsx`
- Conectar com `backend/src/modules/appointments/`
- Lista, criar, editar, cancelar appointments

**Lists Module:**

- Criar `src/components/services/lists/ListsService.tsx`
- Backend pode usar Schedule ou criar novo módulo
- CRUD de listas e itens

**Analytics Module:**

- Criar `src/components/services/analytics/AnalyticsService.tsx`
- Conectar com `backend/src/modules/analytics/`
- Dashboards com gráficos (Recharts)

**Reports Module:**

- Criar `src/components/services/reports/ReportsService.tsx`
- Backend: `backend/src/modules/analytics/` (reports)
- Geração e download de relatórios

**Ecommerce Module:**

- Já existe parcialmente, completar integração
- Products, Orders, Shipments, Reviews

---

## Fase 5: Dashboard Creator - Métricas Completas

### Backend

**Arquivos:** `backend/src/common/metrics/`

- Expandir `metrics.service.ts` para coletar:
- Total requests por rota
- Response time (média, P95, P99)
- Tamanho das respostas (bytes)
- Status codes (2xx, 4xx, 5xx)
- Cache hit/miss rates
- Uptime

- Adicionar endpoint `GET /metrics/detailed`:
- Retornar métricas agrupadas por:
- Cliente
- Rota
- Método HTTP
- Status
- Filtros por período (última hora, dia, semana)

- Armazenar métricas em Redis ou PostgreSQL (tabela de timeseries)

### Frontend

**Arquivo:** `ultradashboard/src/app/(dashboard)/creator/metrics/page.tsx`

- Dashboard completo com:
- KPIs principais (total requests, avg response time, uptime)
- Gráficos de linha (requests over time)
- Gráficos de barras (requests por rota)
- Tabela de rotas mais lentas
- Tabela de rotas com maiores payloads
- Filtros por período e cliente

- Usar Recharts para visualizações
- Auto-refresh a cada 30 segundos

---

## Fase 6: Logs em Tempo Real da VPS

### Backend - WebSocket para Logs

**Arquivos:** `backend/src/`

- Instalar `@nestjs/websockets` e `socket.io`
- Criar módulo `LogsModule`:
- `logs.gateway.ts` - WebSocket gateway
- Capturar logs do Winston e emitir via WebSocket
- Filtros: level (error, warn, info), module, clientId

- Criar endpoint REST também:
- `GET /logs/stream` - SSE (Server-Sent Events) como alternativa
- `GET /logs/recent` - últimos N logs

### Frontend - Visualizador de Logs

**Arquivo:** `ultradashboard/src/app/(dashboard)/creator/logs/page.tsx`

- Conectar via Socket.IO client
- Exibir logs em tempo real (scroll automático)
- Filtros:
- Level (error, warn, info, debug)
- Module
- Cliente
- Search por texto

- Adicionar ao menu lateral do Creator dashboard

---

## Fase 7: Otimizações e Polimento Final

### Frontend

- Implementar cache inteligente:
- React Query com staleTime apropriado
- Prefetch de rotas prováveis
- Optimistic updates

- Loading states consistentes em todos os módulos
- Error boundaries e tratamento de erros
- Toast notifications para feedback
- Skeleton loaders

### Backend

- Rate limiting em rotas críticas
- Validação robusta de DTOs
- Otimizar queries N+1
- Adicionar índices faltantes no Prisma

### Testing

- Testar fluxo completo de registro → pagamento → dashboard
- Testar cada módulo de serviço
- Verificar responsividade mobile

### Deploy/Produção

- Variáveis de ambiente documentadas
- Docker compose atualizado
- Nginx configurado para frontend
- HTTPS configurado

---

## Arquivos Principais a Modificar/Criar

### Backend

- `src/modules/auth/auth.service.ts` - refresh token, forgot password
- `src/modules/stripe/stripe.service.ts` - checkout, webhooks
- `src/modules/stripe/stripe.controller.ts` - webhook endpoint
- `src/common/metrics/metrics.service.ts` - métricas detalhadas
- `src/modules/logs/logs.gateway.ts` (novo) - WebSocket logs
- `prisma/schema.prisma` - adicionar campos Stripe se necessário

### Frontend

- `src/app/page.tsx` - landing page completa
- `src/components/landing/*` - componentes da landing
- `src/app/register/page.tsx` - seleção de serviços
- `src/app/checkout/*` - fluxo de pagamento
- `src/app/forgot-password/page.tsx` - recuperação de senha
- `src/context/AuthContext.tsx` - auto-refresh token
- `src/components/services/calendar/CalendarService.tsx` (novo)
- `src/components/services/lists/ListsService.tsx` (novo)
- `src/components/services/analytics/AnalyticsService.tsx` (novo)
- `src/components/services/reports/ReportsService.tsx` (novo)
- `src/app/(dashboard)/creator/metrics/page.tsx` - dashboard métricas
- `src/app/(dashboard)/creator/logs/page.tsx` (novo) - logs em tempo real

---

## Estimativa de Tempo

- Fase 1 (Auth): 4-6 horas
- Fase 2 (Stripe): 6-8 horas
- Fase 3 (Landing): 8-10 horas
- Fase 4 (Conectar módulos): 10-12 horas
- Fase 5 (Métricas): 4-6 horas
- Fase 6 (Logs tempo real): 4-6 horas
- Fase 7 (Otimizações): 6-8 horas

Total: 42-56 horas

Com trabalho focado de sexta até domingo, é viável completar o MVP com as funcionalidades essenciais.

### To-dos

- [ ] Implementar refresh token, forgot/reset password e verificação de email no backend
- [ ] Implementar auto-refresh token, páginas de forgot/reset password no frontend
- [ ] Configurar produtos Stripe, checkout session com trial, e webhooks
- [ ] Criar fluxo de registro com seleção de serviços e checkout Stripe
- [ ] Criar landing page completa com Hero, Features, Pricing, animações e componentes visuais
- [ ] Conectar módulo Finance com backend real (remover mocks)
- [ ] Criar componente Calendar completo e conectar com backend
- [ ] Finalizar componente Appointments e conectar com backend
- [ ] Criar componente Lists e conectar com backend
- [ ] Criar componente Analytics com dashboards e gráficos
- [ ] Criar componente Reports com geração e visualização
- [ ] Completar integração do módulo Ecommerce
- [ ] Expandir sistema de métricas para coletar dados detalhados (requests, response time, payload size)
- [ ] Criar dashboard de métricas completo no Creator com gráficos e tabelas
- [ ] Implementar WebSocket gateway para logs em tempo real
- [ ] Criar visualizador de logs em tempo real no Creator dashboard
- [ ] Implementar cache inteligente e prefetch no frontend
- [ ] Adicionar error boundaries, toast notifications e loading states consistentes
- [ ] Otimizar queries, adicionar rate limiting e validações robustas
- [ ] Testar fluxo completo de registro → pagamento → dashboard → uso de serviços