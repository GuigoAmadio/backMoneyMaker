# Adicionar ao schema.prisma

Adicione estes models ao final do arquivo `prisma/schema.prisma`:

```prisma
// ==================== WhatsApp Module ====================

model WhatsAppMessage {
  id               String    @id @default(uuid())
  from             String
  to               String
  content          String    @db.Text
  direction        String    // INCOMING ou OUTGOING
  status           String    // PENDING, SENT, DELIVERED, READ, FAILED
  timestamp        DateTime  @default(now())
  conversationId   String?   @map("conversationId")
  replyToMessageId String?   @map("replyToMessageId")
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([from])
  @@index([to])
  @@index([conversationId])
  @@map("whatsapp_messages")
}

model BotCommand {
  id          String   @id @default(uuid())
  phoneNumber String   @map("phoneNumber")
  command     String
  category    String
  args        String   @db.Text // JSON array
  status      String   // PENDING, EXECUTING, COMPLETED, FAILED
  result      String?  @db.Text
  error       String?  @db.Text
  executedAt  DateTime @default(now()) @map("executedAt")
  userId      String?  @map("userId")
  clientId    String?  @map("clientId")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([phoneNumber])
  @@index([clientId])
  @@index([category])
  @@index([executedAt])
  @@map("bot_commands")
}
```

Depois execute:

```bash
npx prisma migrate dev --name add_whatsapp_module
npx prisma generate
```
