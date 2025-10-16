<!-- 66e67f19-bedb-4259-8f35-c8967ae0556c f81e37e2-b81e-44f6-ab97-f61cf57c29c1 -->
# Dynamic Form & Modal System

## Objetivo

Criar sistema de formulários e modais dinâmicos baseado em configuração JSON, similar ao DataTable, para operações CRUD completas.

## Implementação

### 1. Sistema de Tipos

Criar `components/core/DynamicForm/DynamicForm.types.ts`:

- Tipos de campos (text, number, currency, select, file, date, textarea, etc)
- Interface FormConfig com fields, validation schema, layout
- Interface FieldConfig com name, type, label, validation, dependencies

### 2. Componentes de Campo

Criar campos em `components/core/DynamicForm/fields/`:

- TextInput, NumberInput, CurrencyInput
- SelectInput, MultiSelectInput
- DateInput, DateTimeInput
- FileInput (com preview)
- TextAreaInput
- CheckboxInput, SwitchInput
Cada campo integrado com React Hook Form

### 3. DynamicForm Component

Criar `components/core/DynamicForm/DynamicForm.tsx`:

- Recebe FormConfig e valores iniciais
- Usa React Hook Form + Zod para validação
- Renderiza campos baseado na config
- Suporta layout em grid/flex
- Estados de loading, errors, success

### 4. DynamicModal Component

Criar `components/core/DynamicModal/DynamicModal.tsx`:

- Modal wrapper que usa DynamicForm
- Botões de ação (Salvar, Cancelar)
- Loading states
- Suporta create/edit modes
- Integração com toast para feedback

### 5. Configurações de Formulário

Criar em `config/forms/`:

- `products.form.config.tsx` - Formulário de produtos
- `orders.form.config.tsx` - Formulário de pedidos
- `appointments.form.config.tsx` - Formulário de agendamentos
- `users.form.config.tsx` - Formulário de usuários
Cada um com fields + Zod schema

### 6. Integração com Serviços

Atualizar serviços existentes:

- `EcommerceService.tsx` - Adicionar modal de create/edit produto
- `AppointmentsService.tsx` - Modal de agendamentos
- `UsersService.tsx` - Modal de usuários
Substituir `console.log` por `openModal()`

### 7. Hooks Auxiliares

Criar `hooks/useCRUDModal.ts`:

- Hook que gerencia estado do modal (open/close, mode, selectedItem)
- Funções de create/update/delete com reload automático
- Toast notifications automáticas

## Arquivos a Criar

- `components/core/DynamicForm/DynamicForm.types.ts`
- `components/core/DynamicForm/DynamicForm.tsx`
- `components/core/DynamicForm/fields/*.tsx` (8 campos)
- `components/core/DynamicModal/DynamicModal.tsx`
- `config/forms/*.form.config.tsx` (4 configs)
- `hooks/useCRUDModal.ts`

## Resultado Final

CRUD completo configurável com:

- Formulários validados automaticamente
- Modais bonitos e consistentes
- ~50 linhas de config por entidade
- Zero código repetitivo

### To-dos

- [ ] Criar tipos TypeScript para DynamicForm e FieldConfig
- [ ] Criar componentes de campo (TextInput, SelectInput, etc) integrados com React Hook Form
- [ ] Criar componente DynamicForm principal com validação Zod
- [ ] Criar DynamicModal wrapper com UI e estados
- [ ] Criar configurações de formulário para products, orders, appointments, users
- [ ] Criar hook useCRUDModal para gerenciar estado e ações
- [ ] Integrar modais nos serviços (EcommerceService, AppointmentsService, UsersService)