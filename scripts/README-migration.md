# Migração de Horários de Trabalho

Este script migra os horários de trabalho dos funcionários do formato antigo para o novo formato sem alterar o schema do banco de dados.

## Formato Antigo vs Novo

### Formato Antigo

```json
{
  "tuesday": ["08:00", "10:00", "16:00", "19:30"],
  "saturday": ["10:00", "14:00", "18:00"],
  "thursday": ["08:00", "10:00", "12:00", "19:30"]
}
```

### Novo Formato

```json
{
  "timeSlots": [
    {
      "id": "slot_2_0800_0",
      "dayOfWeek": 2,
      "startTime": "08:00",
      "endTime": "09:00",
      "isRecurring": true,
      "isActive": true,
      "specificDate": undefined
    }
  ],
  "timeOffs": []
}
```

## Como Usar

### 1. Testar a Migração

```bash
cd backend
node scripts/migrate-working-hours.js test
```

### 2. Executar a Migração Completa

```bash
cd backend
node scripts/migrate-working-hours.js migrate
```

### 3. Reverter a Migração (Cuidado!)

```bash
cd backend
node scripts/migrate-working-hours.js rollback
```

## Detalhes da Migração

### Regras de Conversão

- **Duração dos horários**: Cada horário antigo vira um slot de 1 hora

  - `"08:00"` → `startTime: "08:00", endTime: "09:00"`
  - `"10:30"` → `startTime: "10:30", endTime: "11:30"`

- **Dias da semana**: Nomes convertidos para números

  - `"tuesday"` → `dayOfWeek: 2`
  - `"saturday"` → `dayOfWeek: 6`

- **IDs únicos**: Gerados automaticamente

  - Formato: `slot_{dayOfWeek}_{startTime}_{index}`
  - Exemplo: `slot_2_0800_0`

- **Configurações padrão**:
  - `isRecurring: true` (todos os horários antigos são recorrentes)
  - `isActive: true` (todos são ativos)
  - `specificDate: undefined` (não há datas específicas)

### Dados de Exemplo

Com base nos dados que você forneceu, aqui estão alguns exemplos de como ficará a migração:

#### Exemplo 1:

**Antes:**

```json
{
  "tuesday": ["08:00", "10:00", "16:00", "19:30"],
  "saturday": ["10:00", "14:00", "18:00"],
  "thursday": ["08:00", "10:00", "12:00", "19:30"]
}
```

**Depois:**

```json
{
  "timeSlots": [
    {
      "id": "slot_2_0800_0",
      "dayOfWeek": 2,
      "startTime": "08:00",
      "endTime": "09:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_2_1000_1",
      "dayOfWeek": 2,
      "startTime": "10:00",
      "endTime": "11:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_2_1600_2",
      "dayOfWeek": 2,
      "startTime": "16:00",
      "endTime": "17:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_2_1930_3",
      "dayOfWeek": 2,
      "startTime": "19:30",
      "endTime": "20:30",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_6_1000_0",
      "dayOfWeek": 6,
      "startTime": "10:00",
      "endTime": "11:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_6_1400_1",
      "dayOfWeek": 6,
      "startTime": "14:00",
      "endTime": "15:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_6_1800_2",
      "dayOfWeek": 6,
      "startTime": "18:00",
      "endTime": "19:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_4_0800_0",
      "dayOfWeek": 4,
      "startTime": "08:00",
      "endTime": "09:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_4_1000_1",
      "dayOfWeek": 4,
      "startTime": "10:00",
      "endTime": "11:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_4_1200_2",
      "dayOfWeek": 4,
      "startTime": "12:00",
      "endTime": "13:00",
      "isRecurring": true,
      "isActive": true
    },
    {
      "id": "slot_4_1930_3",
      "dayOfWeek": 4,
      "startTime": "19:30",
      "endTime": "20:30",
      "isRecurring": true,
      "isActive": true
    }
  ],
  "timeOffs": []
}
```

## Segurança

### Backup Recomendado

Antes de executar a migração, faça backup do banco de dados:

```bash
# PostgreSQL
pg_dump your_database > backup_before_migration.sql

# Ou usando Prisma
npx prisma db pull
```

### Validação

Após a migração, verifique:

1. Se todos os funcionários foram migrados
2. Se os horários estão corretos
3. Se a interface está funcionando

### Rollback

Se algo der errado, use o comando de rollback:

```bash
node scripts/migrate-working-hours.js rollback
```

## Logs

O script fornece logs detalhados:

- ✅ Sucessos
- ⏭️ Registros ignorados (já migrados ou vazios)
- ❌ Erros
- 📊 Resumo final

## Compatibilidade

- ✅ **Backward Compatible**: O novo formato é compatível com o frontend atualizado
- ✅ **Schema Unchanged**: Não altera a estrutura do banco
- ✅ **Reversible**: Pode ser revertido se necessário
- ✅ **Safe**: Não remove dados, apenas converte o formato
