import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// ==================== Infrastructure ====================
import { DatabaseModule } from '../../database/database.module';
import { MetaWhatsAppApiClient } from './infrastructure/whatsapp-api/meta-whatsapp-api.client';
import { WhatsAppMessageRepository } from './infrastructure/persistence/whatsapp-message.repository';
import { BotCommandRepository } from './infrastructure/persistence/bot-command.repository';

// ==================== Application ====================
import { ProcessIncomingMessageUseCase } from './application/use-cases/process-incoming-message.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';
import { ExecuteCommandUseCase } from './application/use-cases/execute-command.use-case';

// Command Handlers
import { ProductsCommandHandler } from './application/command-handlers/products-command.handler';
import { SalesCommandHandler } from './application/command-handlers/sales-command.handler';
import { HelpCommandHandler } from './application/command-handlers/help-command.handler';

// ==================== Presentation ====================
import { WhatsAppController } from './presentation/whatsapp.controller';

// ==================== Symbols (Injection Tokens) ====================
export const WHATSAPP_API_CLIENT = 'IWhatsAppApiClient';
export const WHATSAPP_MESSAGE_REPOSITORY = 'IWhatsAppMessageRepository';
export const BOT_COMMAND_REPOSITORY = 'IBotCommandRepository';
export const COMMAND_HANDLERS = 'COMMAND_HANDLERS';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [WhatsAppController],
  providers: [
    // ==================== Infrastructure ====================
    {
      provide: WHATSAPP_API_CLIENT,
      useClass: MetaWhatsAppApiClient,
    },
    {
      provide: WHATSAPP_MESSAGE_REPOSITORY,
      useClass: WhatsAppMessageRepository,
    },
    {
      provide: BOT_COMMAND_REPOSITORY,
      useClass: BotCommandRepository,
    },

    // ==================== Command Handlers ====================
    ProductsCommandHandler,
    SalesCommandHandler,
    HelpCommandHandler,
    {
      provide: COMMAND_HANDLERS,
      useFactory: (
        productsHandler: ProductsCommandHandler,
        salesHandler: SalesCommandHandler,
        helpHandler: HelpCommandHandler,
      ) => {
        return [productsHandler, salesHandler, helpHandler];
      },
      inject: [ProductsCommandHandler, SalesCommandHandler, HelpCommandHandler],
    },

    // ==================== Use Cases ====================
    {
      provide: ProcessIncomingMessageUseCase,
      useFactory: (messageRepo, executeCommandUseCase) => {
        return new ProcessIncomingMessageUseCase(messageRepo, executeCommandUseCase);
      },
      inject: [WHATSAPP_MESSAGE_REPOSITORY, ExecuteCommandUseCase],
    },
    {
      provide: SendMessageUseCase,
      useFactory: (messageRepo, apiClient) => {
        return new SendMessageUseCase(messageRepo, apiClient);
      },
      inject: [WHATSAPP_MESSAGE_REPOSITORY, WHATSAPP_API_CLIENT],
    },
    {
      provide: ExecuteCommandUseCase,
      useFactory: (commandRepo, handlers) => {
        return new ExecuteCommandUseCase(commandRepo, handlers);
      },
      inject: [BOT_COMMAND_REPOSITORY, COMMAND_HANDLERS],
    },
  ],
  exports: [ProcessIncomingMessageUseCase, SendMessageUseCase, ExecuteCommandUseCase],
})
export class WhatsAppModule {}
