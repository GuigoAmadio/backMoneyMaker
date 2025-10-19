# 🚀 Guia de Instalação Rápida - Módulo WhatsApp

## 📋 Checklist

- [ ] 1. Adicionar models ao Prisma
- [ ] 2. Executar migration
- [ ] 3. Instalar dependências
- [ ] 4. Configurar variáveis de ambiente
- [ ] 5. Registrar módulo no App
- [ ] 6. Configurar WhatsApp Business API
- [ ] 7. Testar

---

## 1️⃣ Adicionar Models ao Prisma

Abra `prisma/schema.prisma` e adicione ao final:

```prisma
model WhatsAppMessage {
  id               String    @id @default(uuid())
  from             String
  to               String
  content          String    @db.Text
  direction        String
  status           String
  timestamp        DateTime  @default(now())
  conversationId   String?
  replyToMessageId String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

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
  args        String   @db.Text
  status      String
  result      String?  @db.Text
  error       String?  @db.Text
  executedAt  DateTime @default(now())
  userId      String?
  clientId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([phoneNumber])
  @@index([clientId])
  @@index([category])
  @@map("bot_commands")
}
```

---

## 2️⃣ Executar Migration

```bash
cd backend

# Gerar migration
npx prisma migrate dev --name add_whatsapp_module

# Gerar Prisma Client
npx prisma generate
```

---

## 3️⃣ Instalar Dependências

```bash
npm install uuid
npm install --save-dev @types/uuid
```

---

## 4️⃣ Configurar Variáveis de Ambiente

Adicione ao `.env`:

```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_PERMANENTE
WHATSAPP_VERIFY_TOKEN=qualquer_token_secreto_que_voce_quiser
WHATSAPP_PHONE_NUMBER=5511999999999
```

**Como obter as credenciais:**

1. Acesse: https://developers.facebook.com/apps
2. Crie um app ou use existente
3. Adicione produto "WhatsApp"
4. Em "WhatsApp > API Setup":
   - Copie o **Phone Number ID**
   - Copie o **Access Token** (gere um permanente!)
5. Defina seu próprio **Verify Token** (qualquer string)

---

## 5️⃣ Registrar Módulo no App

Abra `src/app.module.ts` e adicione:

```typescript
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    // ... módulos existentes
    WhatsAppModule, // ← Adicione aqui
  ],
})
export class AppModule {}
```

---

## 6️⃣ Configurar WhatsApp Business API

### A. Expor Servidor Publicamente (Desenvolvimento)

```bash
# Instalar ngrok (se não tiver)
npm install -g ngrok

# Expor servidor
ngrok http 3000
```

Vai mostrar algo como:

```
Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

### B. Configurar Webhook no Meta

1. Acesse: https://developers.facebook.com/apps
2. Vá em "WhatsApp > Configuration"
3. Em "Webhook":
   - **Callback URL**: `https://abc123.ngrok.io/api/v1/whatsapp/webhook`
   - **Verify Token**: o que você colocou no `.env`
4. Clique em "Verify and Save"
5. Inscreva-se em:
   - ✅ `messages`
   - ✅ `message_status`

---

## 7️⃣ Testar

### A. Iniciar Servidor

```bash
npm run start:dev
```

### B. Verificar Status

Acesse no navegador:

```
http://localhost:3000/api/v1/whatsapp/status
```

Deve retornar:

```json
{
  "success": true,
  "module": "WhatsApp",
  "status": "online",
  "config": {
    "phoneNumberId": true,
    "accessToken": true,
    "verifyToken": true
  }
}
```

### C. Enviar Mensagem de Teste

Envie uma mensagem para o número do seu WhatsApp Business:

```
/ajuda
```

Você deve receber uma resposta automática com os comandos!

### D. Testar Comandos

```
/produtos
/vendas
/estoque
```

---

## 🎉 Pronto!

Seu bot WhatsApp com DDD está funcionando!

### Próximos Passos:

1. **Adicionar mais comandos** em `command-type.vo.ts`
2. **Criar novos handlers** em `application/command-handlers/`
3. **Configurar permissões** por role
4. **Deploy em produção** (usar domínio real ao invés de ngrok)

---

## 🚨 Troubleshooting

### Erro: "WhatsAppMessage não existe"

- Execute: `npx prisma generate`
- Reinicie o servidor

### Erro: "Webhook verification failed"

- Verifique se `WHATSAPP_VERIFY_TOKEN` no `.env` é exatamente igual ao configurado no Meta

### Erro: "Cannot send message"

- Verifique `WHATSAPP_ACCESS_TOKEN`
- Gere um token **permanente** (não temporário)
- Token temporário expira em 24h!

### Bot não responde

- Verifique logs do servidor: `npm run start:dev`
- Verifique se webhook está configurado corretamente
- Teste a URL do webhook diretamente:
  ```bash
  curl "http://localhost:3000/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=SEU_TOKEN"
  ```

---

## 📚 Documentação Completa

Consulte `README.md` para:

- Arquitetura DDD completa
- Como adicionar novos comandos
- Sistema de permissões
- Boas práticas
- Monitoramento

---

**Dúvidas? Abra uma issue ou consulte a documentação oficial:**

- https://developers.facebook.com/docs/whatsapp
