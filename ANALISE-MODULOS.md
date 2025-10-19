# 📊 ANÁLISE DE MÓDULOS - BACKEND MONEYMAKER

> **Data:** 19/10/2025  
> **Objetivo:** Análise dos módulos existentes e recomendações para sistema de gerenciamento de tarefas/trabalho em grupo

---

## **📦 MÓDULOS EXISTENTES - STATUS**

### **🟢 COMPLETOS E ROBUSTOS:**

1. **Auth** ✅
   - Sistema completo de autenticação
   - Multi-tenant
   - Refresh tokens
   - Recuperação de senha
   - Verificação de email
   - **Status:** PRODUÇÃO

2. **Finances** ✅
   - Transações, Workspaces, Metas, Orçamentos
   - Sistema de membros e permissões
   - Notificações
   - Auditoria
   - **Status:** PRODUÇÃO

3. **Employees** ✅
   - CRUD completo
   - Cache com SSE
   - Estatísticas
   - Disponibilidade
   - **Status:** PRODUÇÃO

4. **Products** ✅
   - C++ Native Addon (DDD)
   - Performance extrema
   - Validações nativas
   - **Status:** PRODUÇÃO

---

### **🟡 FUNCIONAIS MAS PODEM MELHORAR:**

5. **Schedule** ⚠️
   - **Atual:** Agendamento com status, prioridades, categorias
   - **Problema:** Tem interface `Task` mas não desenvolvida
   - **Melhorias necessárias:**
     - [ ] Separar conceito de "Agenda" vs "Tarefa"
     - [ ] Focar em calendário e eventos
     - [ ] Remover lógica de tasks (mover para módulo dedicado)
     - [ ] Adicionar recorrência de eventos
     - [ ] Melhorar integração com compromissos (appointments)

6. **Annotations** ⚠️
   - **Atual:** Sistema básico de anotações
   - **Melhorias necessárias:**
     - [ ] Adicionar rich text / markdown
     - [ ] Sistema de tags
     - [ ] Busca avançada
     - [ ] Anexos de arquivos
     - [ ] Versionamento de anotações
     - [ ] Compartilhamento mais granular

7. **Appointments** ⚠️
   - **Atual:** Compromissos básicos
   - **Melhorias necessárias:**
     - [ ] Sistema de recorrência
     - [ ] Integração com Schedule (calendário)
     - [ ] Notificações automáticas
     - [ ] Confirmação de presença
     - [ ] Google Calendar sync

8. **Analytics** ⚠️
   - **Melhorias necessárias:**
     - [ ] Mais tipos de eventos
     - [ ] Dashboards customizáveis
     - [ ] Exportação de relatórios
     - [ ] Real-time analytics

9. **Clients** ⚠️
   - **Melhorias necessárias:**
     - [ ] Histórico de interações
     - [ ] Segmentação avançada
     - [ ] CRM features
     - [ ] Pontuação/scoring

---

### **🔴 BÁSICOS OU INCOMPLETOS:**

10. **Dashboard** 🔨
    - **Status:** Básico
    - **Precisa:** Mais métricas, widgets customizáveis

11. **WhatsApp** 🔨
    - **Status:** Integração básica
    - **Precisa:** Bot mais inteligente, templates, automações

12. **E-commerce** 🔨
    - **Status:** Estrutura inicial
    - **Precisa:** Completar funcionalidades

---

## **🎯 RECOMENDAÇÃO: CRIAR NOVO MÓDULO "TASKS"**

### **Por que criar um novo módulo?**

1. ✅ **Separação de responsabilidades**
   - Schedule = Calendário e Eventos
   - Tasks = Gerenciamento de Tarefas e Projetos

2. ✅ **Integração natural com Workspaces**
   - Já existe infraestrutura de workspaces em Finances
   - Tasks podem pertencer a workspaces
   - Membros do workspace podem ser atribuídos a tasks

3. ✅ **Escalabilidade**
   - Módulo dedicado cresce independente
   - Não polui outros módulos

4. ✅ **Features específicas de Tasks**
   - Kanban boards
   - Sprints/Milestones
   - Time tracking
   - Dependências entre tarefas
   - Subtarefas aninhadas

---

## **🚀 PROPOSTA: MÓDULO "TASKS" COMPLETO**

### **Estrutura do Módulo:**

```
backend/src/modules/tasks/
├── application/
│   ├── use-cases/
│   │   ├── create-task/
│   │   ├── update-task/
│   │   ├── assign-member/
│   │   ├── move-to-column/
│   │   ├── create-board/
│   │   └── track-time/
│   └── dtos/
├── domain/
│   ├── entities/
│   │   ├── task.entity.ts
│   │   ├── board.entity.ts
│   │   ├── column.entity.ts
│   │   ├── sprint.entity.ts
│   │   └── time-entry.entity.ts
│   ├── value-objects/
│   │   ├── task-priority.vo.ts
│   │   ├── task-status.vo.ts
│   │   └── task-type.vo.ts
│   └── repositories/
├── infrastructure/
│   └── persistence/
└── presentation/
    ├── tasks.controller.ts
    ├── boards.controller.ts
    └── sprints.controller.ts
```

---

### **Features do Módulo Tasks:**

#### **1. Tarefas (Tasks)**

- ✅ CRUD completo
- ✅ Status customizáveis (To Do, In Progress, Done, etc)
- ✅ Prioridades (Low, Medium, High, Critical)
- ✅ Tipos (Task, Bug, Feature, Epic)
- ✅ Descrição rica (Markdown)
- ✅ Anexos
- ✅ Comentários/discussões
- ✅ Subtarefas aninhadas (infinito)
- ✅ Tags/Labels customizáveis
- ✅ Checklists
- ✅ Dependências (blocked by, blocks)
- ✅ Estimativas de tempo
- ✅ Time tracking real
- ✅ Due dates e reminders
- ✅ Atribuição múltipla de membros
- ✅ Histórico completo (audit log)

#### **2. Boards (Kanban)**

- ✅ Boards por workspace
- ✅ Colunas customizáveis
- ✅ Drag & drop entre colunas
- ✅ WIP limits por coluna
- ✅ Filtros avançados
- ✅ Busca full-text
- ✅ Templates de boards

#### **3. Sprints/Milestones**

- ✅ Criar sprints
- ✅ Atribuir tasks a sprints
- ✅ Burndown charts
- ✅ Velocity tracking
- ✅ Sprint retrospectives

#### **4. Integração com Workspaces**

- ✅ Tasks pertencem a workspaces
- ✅ Permissões por workspace role
- ✅ Notificações para membros
- ✅ Activity feed do workspace

#### **5. Relatórios e Analytics**

- ✅ Produtividade por membro
- ✅ Tempo médio por task
- ✅ Tasks completadas por período
- ✅ Burndown/Burnup charts
- ✅ Cycle time
- ✅ Lead time

---

### **Schema Prisma (Adicionar):**

```prisma
model Board {
  id          String   @id @default(cuid())
  name        String
  description String?
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  columns     BoardColumn[]
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@map("boards")
}

model BoardColumn {
  id          String   @id @default(cuid())
  name        String
  order       Int
  wipLimit    Int?
  boardId     String
  board       Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([boardId])
  @@map("board_columns")
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  type        TaskType     @default(TASK)
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)

  // Relacionamentos
  workspaceId String
  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  boardId     String?
  board       Board?       @relation(fields: [boardId], references: [id])
  columnId    String?
  column      BoardColumn? @relation(fields: [columnId], references: [id])

  // Hierarquia
  parentTaskId String?
  parentTask   Task?   @relation("TaskSubtasks", fields: [parentTaskId], references: [id])
  subtasks     Task[]  @relation("TaskSubtasks")

  // Atribuição
  assignees    TaskAssignment[]

  // Sprint
  sprintId    String?
  sprint      Sprint? @relation(fields: [sprintId], references: [id])

  // Estimativas e tempo
  estimatedHours Decimal?
  timeEntries    TimeEntry[]

  // Datas
  dueDate     DateTime?
  startDate   DateTime?
  completedAt DateTime?

  // Metadados
  tags        String[]
  labels      String[]

  // Dependências
  blockedBy   TaskDependency[] @relation("BlockedTasks")
  blocks      TaskDependency[] @relation("BlockingTasks")

  // Comentários e anexos
  comments    TaskComment[]
  attachments TaskAttachment[]

  // Audit
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@index([boardId])
  @@index([columnId])
  @@index([sprintId])
  @@index([status])
  @@index([priority])
  @@map("tasks")
}

model TaskAssignment {
  id         String   @id @default(cuid())
  taskId     String
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([userId])
  @@map("task_assignments")
}

model TaskDependency {
  id             String @id @default(cuid())
  taskId         String
  task           Task   @relation("BlockedTasks", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTaskId String
  dependsOnTask  Task   @relation("BlockingTasks", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)
  type           String // "blocks", "blocked_by", "relates_to"

  @@unique([taskId, dependsOnTaskId])
  @@index([taskId])
  @@index([dependsOnTaskId])
  @@map("task_dependencies")
}

model TaskComment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
  @@map("task_comments")
}

model TaskAttachment {
  id        String   @id @default(cuid())
  filename  String
  url       String
  mimeType  String
  size      Int
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User  @relation(fields: [uploadedById], references: [id])
  createdAt DateTime @default(now())

  @@index([taskId])
  @@map("task_attachments")
}

model Sprint {
  id          String   @id @default(cuid())
  name        String
  goal        String?
  startDate   DateTime
  endDate     DateTime
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tasks       Task[]
  status      SprintStatus @default(PLANNED)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
  @@map("sprints")
}

model TimeEntry {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  description String?
  hours       Decimal
  date        DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([taskId])
  @@index([userId])
  @@map("time_entries")
}

enum TaskType {
  TASK
  BUG
  FEATURE
  EPIC
  STORY
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SprintStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

## **🔄 MELHORIAS EM MÓDULOS EXISTENTES**

### **1. Finances - Workspace** (Expandir)

```typescript
// Adicionar campos para suportar projetos
model Workspace {
  // ... campos existentes

  // NOVOS:
  type        WorkspaceType @default(FINANCE) // FINANCE | PROJECT | TEAM
  boards      Board[]
  sprints     Sprint[]
  tasks       Task[]
  settings    Json? // configurações customizáveis
}
```

### **2. Schedule** (Refatorar)

- Remover interface `Task`
- Focar em eventos de calendário
- Adicionar recorrência
- Melhorar integração com Google Calendar

### **3. Annotations** (Melhorar)

- Rich text editor
- Tags e categorias
- Busca full-text
- Anexos

---

## **📈 ROADMAP SUGERIDO**

### **Fase 1: Fundação (2 semanas)**

- [ ] Criar módulo Tasks (estrutura base)
- [ ] Schema Prisma
- [ ] CRUD de Tasks
- [ ] CRUD de Boards
- [ ] Integração com Workspaces

### **Fase 2: Features Core (2 semanas)**

- [ ] Sistema de colunas (Kanban)
- [ ] Drag & drop
- [ ] Atribuição de membros
- [ ] Subtarefas
- [ ] Comentários

### **Fase 3: Features Avançadas (2 semanas)**

- [ ] Sprints/Milestones
- [ ] Time tracking
- [ ] Dependências entre tasks
- [ ] Tags e labels
- [ ] Anexos

### **Fase 4: Analytics e Integrações (1 semana)**

- [ ] Burndown charts
- [ ] Relatórios
- [ ] Notificações
- [ ] Webhooks

### **Fase 5: Frontend (2 semanas)**

- [ ] UI no ultradashboard
- [ ] Kanban board component
- [ ] Task detail modal
- [ ] Sprint planning view
- [ ] Analytics dashboard

---

## **💡 CONCLUSÃO**

**RECOMENDAÇÃO FINAL: CRIAR NOVO MÓDULO "TASKS"**

✅ **Vantagens:**

- Separação clara de responsabilidades
- Escalável e focado
- Integração natural com Workspaces existente
- Não polui outros módulos
- Permite features específicas de gerenciamento de projetos

⚠️ **Alternativa (NÃO recomendada):**

- Expandir Schedule para incluir tasks
- Problema: Mistura conceitos diferentes (calendário vs gerenciamento de projetos)
- Ficaria muito complexo e difícil de manter

---

**Próximos passos:**

1. Aprovar proposta do módulo Tasks
2. Criar estrutura base do módulo
3. Implementar schema Prisma
4. Desenvolver use cases principais
5. Criar endpoints da API
6. Construir frontend no ultradashboard

---

_Este documento será atualizado conforme o desenvolvimento avança._

