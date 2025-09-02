# Módulo Schedule - Documentação

## 📋 Visão Geral

O módulo Schedule foi criado para funcionar como uma agenda completa, onde cada registro representa um dia do calendário com tarefas e informações organizacionais.

## 🗄️ Estrutura do Banco de Dados

### Tabela `schedules`

| Campo              | Tipo                | Descrição                         |
| ------------------ | ------------------- | --------------------------------- |
| `id`               | UUID                | Identificador único               |
| `clientId`         | UUID                | ID do cliente (multi-tenant)      |
| `userId`           | UUID                | ID do usuário responsável         |
| `employeeId`       | UUID (opcional)     | ID do funcionário designado       |
| `date`             | DateTime            | Data específica do calendário     |
| `title`            | String              | Título da agenda                  |
| `description`      | String (opcional)   | Descrição detalhada               |
| `tasks`            | JSON                | Array de tarefas do dia           |
| `status`           | Enum                | Status da agenda                  |
| `priority`         | Enum                | Prioridade da agenda              |
| `startTime`        | DateTime (opcional) | Horário de início                 |
| `endTime`          | DateTime (opcional) | Horário de fim                    |
| `allDay`           | Boolean             | Se é um evento de dia inteiro     |
| `isRecurring`      | Boolean             | Se é um evento recorrente         |
| `recurringPattern` | JSON (opcional)     | Padrão de recorrência             |
| `color`            | String (opcional)   | Cor para categorização visual     |
| `category`         | Enum                | Categoria da agenda               |
| `reminders`        | JSON                | Array de lembretes configurados   |
| `attachments`      | String[]            | URLs de anexos                    |
| `isPublic`         | Boolean             | Se é visível para outros usuários |
| `completedAt`      | DateTime (opcional) | Data de conclusão                 |
| `createdAt`        | DateTime            | Data de criação                   |
| `updatedAt`        | DateTime            | Data de última atualização        |

### Enums

#### ScheduleStatus

- `PENDING` - Pendente
- `IN_PROGRESS` - Em progresso
- `COMPLETED` - Concluída
- `CANCELLED` - Cancelada
- `POSTPONED` - Adiada

#### SchedulePriority

- `LOW` - Baixa
- `MEDIUM` - Média
- `HIGH` - Alta
- `URGENT` - Urgente

#### ScheduleCategory

- `WORK` - Trabalho
- `PERSONAL` - Pessoal
- `MEETING` - Reunião
- `APPOINTMENT` - Compromisso
- `REMINDER` - Lembrete
- `OTHER` - Outro

## 🔗 Relacionamentos

- **Cliente**: Cada agenda pertence a um cliente (CASCADE)
- **Usuário**: Cada agenda é criada por um usuário (CASCADE)
- **Funcionário**: Agenda pode ser designada a um funcionário (OPTIONAL)

## 📡 API Endpoints

### Principais Endpoints

#### `POST /schedule`

Criar nova agenda

- **Body**: `CreateScheduleDto`
- **Response**: Agenda criada com dados do usuário e funcionário

#### `GET /schedule`

Listar agendas com filtros

- **Query Parameters**:
  - `startDate`, `endDate`: Filtrar por período
  - `date`: Data específica
  - `status`: Filtrar por status
  - `priority`: Filtrar por prioridade
  - `category`: Filtrar por categoria
  - `employeeId`: Filtrar por funcionário
  - `publicOnly`: Apenas agendas públicas
  - `search`: Buscar por título/descrição
  - `page`, `limit`: Paginação
  - `sortBy`, `sortOrder`: Ordenação

#### `GET /schedule/today`

Obter agendas de hoje

#### `GET /schedule/stats`

Obter estatísticas das agendas

#### `GET /schedule/:id`

Buscar agenda específica por ID

#### `PATCH /schedule/:id`

Atualizar agenda

- **Body**: `UpdateScheduleDto`

#### `PATCH /schedule/:id/status`

Atualizar apenas o status da agenda

- **Body**: `{ status: ScheduleStatus }`

#### `DELETE /schedule/:id`

Deletar agenda

## 🛡️ Segurança e Permissões

- **Autenticação**: JWT obrigatório
- **Multi-tenant**: Filtragem automática por `clientId`
- **Permissões**:
  - Usuários podem ver suas próprias agendas + agendas públicas
  - Usuários só podem editar/deletar suas próprias agendas
  - Agendas públicas são visíveis para todos os usuários do cliente

## 🔧 Recursos Implementados

### Cache Inteligente

- Cache automático por cliente e usuário
- Invalidação automática em operações CUD
- Chaves de cache:
  - `schedules:{clientId}:{userId}`
  - `schedules:{clientId}:today`
  - `schedules:{clientId}:stats`

### Notificações

- Notificações Telegram automáticas para:
  - Criação de agenda
  - Atualização de agenda
  - Mudança de status
  - Exclusão de agenda
  - Erros críticos

### Validações

- Verificação de existência de usuário e funcionário
- Constraint única: uma agenda por usuário por dia
- Validação de datas e campos obrigatórios

### Funcionalidades Especiais

- **Busca textual**: Por título e descrição
- **Filtros avançados**: Por status, prioridade, categoria, funcionário
- **Paginação**: Suporte completo com contagem total
- **Ordenação**: Por qualquer campo com direção asc/desc
- **Estatísticas**: Contadores e métricas de produtividade

## 📊 Estrutura de Dados JSON

### Tasks (Tarefas)

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: SchedulePriority;
  dueTime?: string;
}
```

### Reminders (Lembretes)

```typescript
interface Reminder {
  type: 'email' | 'notification' | 'sms';
  minutesBefore: number;
  enabled: boolean;
}
```

### Recurring Pattern (Padrão de Recorrência)

```typescript
interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
}
```

## 🚀 Como Aplicar

### 1. Migração do Banco

Execute o arquivo `schedule_migration.sql` no seu banco PostgreSQL.

### 2. Gerar Cliente Prisma

```bash
npx prisma generate
```

### 3. Testar API

O módulo está registrado no `app.module.ts` e pronto para uso.

## 📝 Exemplo de Uso

### Criar Agenda

```json
POST /schedule
{
  "title": "Planejamento Diário",
  "description": "Organizar tarefas do dia",
  "date": "2025-08-31",
  "priority": "HIGH",
  "category": "WORK",
  "tasks": [
    {
      "id": "1",
      "title": "Revisar relatórios",
      "completed": false,
      "priority": "HIGH"
    }
  ],
  "reminders": [
    {
      "type": "notification",
      "minutesBefore": 30,
      "enabled": true
    }
  ]
}
```

### Filtrar Agendas

```
GET /schedule?startDate=2025-08-01&endDate=2025-08-31&status=PENDING&priority=HIGH&page=1&limit=10
```

## 🎯 Características Únicas

1. **Uma agenda por usuário por dia**: Evita duplicações
2. **Flexibilidade de horários**: Suporte a eventos de dia inteiro ou com horário específico
3. **Sistema de tarefas integrado**: JSON flexível para diferentes tipos de tarefas
4. **Visibilidade controlada**: Agendas privadas vs públicas
5. **Integração com funcionários**: Designação opcional de responsáveis
6. **Notificações inteligentes**: Alertas automáticos para eventos importantes
