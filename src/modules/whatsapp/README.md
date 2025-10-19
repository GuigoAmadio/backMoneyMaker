# 🤖 Módulo WhatsApp - DDD Architecture

## 📋 Visão Geral

Este módulo implementa integração completa com **WhatsApp Business API (Oficial)** usando **Domain-Driven Design (DDD)**.

### ✨ Funcionalidades

- ✅ Receber e enviar mensagens via WhatsApp
- ✅ Sistema de comandos com permissões por role
- ✅ Queries controladas ao banco de dados
- ✅ Webhooks para mensagens em tempo real
- ✅ Arquitetura DDD completa
- ✅ Rastreamento de comandos e conversas

---

## 🏗️ Arquitetura DDD

```
whatsapp/
├── domain/                          # 🔵 Camada de Domínio
│   ├── entities/                    # Entidades ricas com comportamento
│   │   ├── whatsapp-message.entity.ts
│   │   └── bot-command.entity.ts
│   ├── value-objects/               # Objetos de valor imutáveis
│   │   ├── phone-number.vo.ts
│   │   ├── command-type.vo.ts
│   │   └── message-content.vo.ts
│   └── repositories/                # Interfaces dos repositórios
│       ├── whatsapp-message.repository.interface.ts
│       └── bot-command.repository.interface.ts
│
├── application/                     # 🟢 Camada de Aplicação
│   ├── use-cases/                   # Casos de uso
│   │   ├── process-incoming-message.use-case.ts
│   │   ├── send-message.use-case.ts
│   │   └── execute-command.use-case.ts
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── process-message.dto.ts
│   │   └── send-message.dto.ts
│   └── command-handlers/            # Handlers específicos por domínio
│       ├── products-command.handler.ts
│       ├── sales-command.handler.ts
│       └── help-command.handler.ts
│
├── infrastructure/                  # 🟡 Camada de Infraestrutura
│   ├── whatsapp-api/                # Cliente da API do WhatsApp
│   │   ├── whatsapp-api-client.interface.ts
│   │   └── meta-whatsapp-api.client.ts
│   └── persistence/                 # Implementação de repositórios
│       ├── whatsapp-message.repository.ts
│       └── bot-command.repository.ts
│
├── presentation/                    # 🔴 Camada de Apresentação
│   └── whatsapp.controller.ts       # Controller REST para webhooks
│
└── whatsapp.module.ts               # Configuração do módulo NestJS
```

---

## 🚀 Instalação

### 1. Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# WhatsApp Business API (Meta)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_VERIFY_TOKEN=seu_token_secreto_qualquer
WHATSAPP_PHONE_NUMBER=5511999999999
```

### 2. Criar Tabelas no Banco

Execute a migration Prisma (crie o schema abaixo):

```prisma
// schema.prisma

model WhatsAppMessage {
  id             String   @id @default(uuid())
  from           String
  to             String
  content        String   @db.Text
  direction      String   // INCOMING ou OUTGOING
  status         String   // PENDING, SENT, DELIVERED, READ, FAILED
  timestamp      DateTime @default(now())
  conversationId String?
  replyToMessageId String?

  @@index([from])
  @@index([to])
  @@index([conversationId])
  @@map("whatsapp_messages")
}

model BotCommand {
  id          String   @id @default(uuid())
  phoneNumber String
  command     String
  category    String
  args        String   @db.Text // JSON array
  status      String   // PENDING, EXECUTING, COMPLETED, FAILED
  result      String?  @db.Text
  error       String?  @db.Text
  executedAt  DateTime @default(now())
  userId      String?
  clientId    String?

  @@index([phoneNumber])
  @@index([clientId])
  @@index([category])
  @@map("bot_commands")
}
```

Execute:

```bash
npx prisma migrate dev --name add_whatsapp_tables
```

### 3. Registrar Módulo no App

Adicione ao `app.module.ts`:

```typescript
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    // ... outros módulos
    WhatsAppModule,
  ],
})
export class AppModule {}
```

---

## ⚙️ Configuração WhatsApp Business API

### 1. Criar Conta Business

1. Acesse: https://developers.facebook.com/apps
2. Crie um novo app
3. Adicione o produto "WhatsApp"
4. Configure o número de telefone

### 2. Obter Credenciais

**Phone Number ID:**

- Vá em WhatsApp > API Setup
- Copie o "Phone number ID"

**Access Token:**

- Vá em WhatsApp > API Setup
- Copie o "Temporary access token"
- **IMPORTANTE**: Gere um token permanente para produção

**Verify Token:**

- Você mesmo define (qualquer string secreta)
- Exemplo: `minha_chave_secreta_12345`

### 3. Configurar Webhook

1. Vá em WhatsApp > Configuration
2. Configure o Webhook URL:
   ```
   https://seu-dominio.com/api/v1/whatsapp/webhook
   ```
3. Verify Token: o que você definiu no `.env`
4. Inscreva-se em:
   - ✅ `messages`
   - ✅ `message_status`

---

## 🎯 Comandos Disponíveis

### 📦 Produtos (Público)

```
/produtos - Lista produtos disponíveis
/produto [id] - Detalhes de um produto específico
```

### 📊 Vendas (Requer Autenticação)

```
/vendas - Resumo geral de vendas
/vendashoje - Vendas de hoje
```

### 📦 Estoque (Admin/Manager)

```
/estoque - Produtos com estoque baixo
/estoque [id] - Estoque de um produto
```

### ❓ Ajuda

```
/ajuda - Ver todos os comandos
/help - Ver todos os comandos
```

---

## 🔒 Sistema de Permissões

Cada comando tem:

1. **Categoria**: PRODUCTS, SALES, ORDERS, etc.
2. **Requer Autenticação**: `true/false`
3. **Roles Permitidas**: `['admin', 'manager', 'seller']`

**Exemplo:**

```typescript
// products-command.handler.ts
canHandle(command: BotCommand): boolean {
  return command.getCommandType().getCategory() === CommandCategory.PRODUCTS;
}
```

**Controle em `command-type.vo.ts`:**

```typescript
const commandMap = {
  '/produtos': {
    category: CommandCategory.PRODUCTS,
    requiresAuth: false,
    roles: [],
  },
  '/estoque': {
    category: CommandCategory.PRODUCTS,
    requiresAuth: true,
    roles: ['admin', 'manager'],
  },
};
```

---

## 📝 Como Adicionar Novo Comando

### 1. Adicionar ao `command-type.vo.ts`

```typescript
'/novocomando': {
  category: CommandCategory.PRODUCTS,
  requiresAuth: true,
  roles: ['admin']
},
```

### 2. Implementar no Handler

```typescript
// products-command.handler.ts
async execute(command: BotCommand): Promise<string> {
  switch (commandText) {
    case '/novocomando':
      return this.handleNovoComando(clientId, args);
    // ...
  }
}

private async handleNovoComando(clientId: string, args: string[]): Promise<string> {
  // Implementar lógica
  const result = await this.prisma.product.findMany(...);
  return this.formatSuccess('Resultado aqui');
}
```

---

## 🧪 Como Testar

### 1. Testar Webhook Localmente

Use `ngrok` para expor seu localhost:

```bash
ngrok http 3000
```

Configure a URL do ngrok no Meta Business Manager.

### 2. Enviar Mensagem de Teste

Envie uma mensagem para o número do seu WhatsApp Business:

```
/produtos
```

### 3. Verificar Logs

```bash
npm run start:dev
```

Você verá:

```
[WhatsAppController] 📥 Webhook recebido
[ProcessIncomingMessageUseCase] 📥 Processando mensagem de 5511999999999
[ExecuteCommandUseCase] 🎯 Executando comando: /produtos
[ProductsCommandHandler] ⚡ Handler encontrado, executando...
```

---

## 💡 Boas Práticas

### 1. Limitação de Queries

Os handlers **só podem fazer queries limitadas** definidas no código:

```typescript
// ✅ BOM: Query controlada
const products = await this.prisma.product.findMany({
  where: { clientId },
  take: 10, // Limite definido
});

// ❌ RUIM: Query sem controle
const products = await this.prisma.$queryRaw`SELECT * FROM products`;
```

### 2. Validação de Inputs

Use Value Objects para validar:

```typescript
const phoneNumber = PhoneNumber.create(userInput); // Valida formato
const content = MessageContent.create(userInput); // Valida tamanho
```

### 3. Logs e Rastreamento

Todos os comandos são salvos no banco:

```typescript
await this.commandRepository.save(command);
```

Você pode auditar:

- Quem executou
- Quando executou
- Resultado/Erro

---

## 📊 Monitoramento

### Queries Úteis

```sql
-- Comandos mais usados
SELECT command, COUNT(*) as count
FROM bot_commands
WHERE status = 'COMPLETED'
GROUP BY command
ORDER BY count DESC;

-- Taxa de erro por comando
SELECT command,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as errors
FROM bot_commands
GROUP BY command;

-- Usuários mais ativos
SELECT phoneNumber, COUNT(*) as commands
FROM bot_commands
GROUP BY phoneNumber
ORDER BY commands DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Erro: "Token de verificação inválido"

- Verifique `WHATSAPP_VERIFY_TOKEN` no `.env`
- Deve ser igual ao configurado no Meta Business Manager

### Erro: "Cannot send message"

- Verifique `WHATSAPP_ACCESS_TOKEN`
- Gere um token permanente (não temporário)
- Verifique se o número está ativo

### Erro: "Webhook não recebe mensagens"

- Verifique se a URL está acessível publicamente
- Use `ngrok` para desenvolvimento
- Verifique logs do servidor

---

## 📚 Referências

- [WhatsApp Business API - Meta](https://developers.facebook.com/docs/whatsapp)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [NestJS Modules](https://docs.nestjs.com/modules)

---

## 🎉 Pronto!

Seu bot WhatsApp com DDD está configurado! 🚀

Para adicionar mais comandos, basta:

1. Definir em `command-type.vo.ts`
2. Implementar em um `CommandHandler`
3. Registrar no `WhatsAppModule`

**Questões? Consulte a documentação ou os comentários no código!** 💬
