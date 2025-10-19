-- Tabela de Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY,
    "from" VARCHAR(20) NOT NULL,
    "to" VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    direction VARCHAR(20) NOT NULL, -- INCOMING ou OUTGOING
    status VARCHAR(20) NOT NULL, -- PENDING, SENT, DELIVERED, READ, FAILED
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" VARCHAR(255),
    "replyToMessageId" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_messages_from ON whatsapp_messages("from");
CREATE INDEX idx_whatsapp_messages_to ON whatsapp_messages("to");
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages("conversationId");

-- Tabela de Comandos do Bot
CREATE TABLE IF NOT EXISTS bot_commands (
    id VARCHAR(255) PRIMARY KEY,
    "phoneNumber" VARCHAR(20) NOT NULL,
    command VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    args TEXT NOT NULL, -- JSON array
    status VARCHAR(20) NOT NULL, -- PENDING, EXECUTING, COMPLETED, FAILED
    result TEXT,
    error TEXT,
    "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" VARCHAR(255),
    "clientId" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_commands_phone ON bot_commands("phoneNumber");
CREATE INDEX idx_bot_commands_client ON bot_commands("clientId");
CREATE INDEX idx_bot_commands_category ON bot_commands(category);
CREATE INDEX idx_bot_commands_executed_at ON bot_commands("executedAt");

COMMENT ON TABLE whatsapp_messages IS 'Armazena todas as mensagens trocadas via WhatsApp';
COMMENT ON TABLE bot_commands IS 'Armazena todos os comandos executados pelo bot com auditoria';

