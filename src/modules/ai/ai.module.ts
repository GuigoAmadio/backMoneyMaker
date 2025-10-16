import { Module } from '@nestjs/common';
import { AIService } from './services/ai.service';
import { AIGateway } from './gateway/ai.gateway';
import { OllamaService } from './services/ollama.service';
import { VectorStoreService } from './services/vector-store.service';
import { DataAgentService } from './services/agents/data-agent.service';
import { NavigationAgentService } from './services/agents/navigation-agent.service';
import { ActionAgentService } from './services/agents/action-agent.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * AI Module
 *
 * Provides intelligent chat assistant capabilities with:
 * - Natural language processing via Llama 3.1 (Ollama)
 * - Vector storage for knowledge base (ChromaDB)
 * - Dashboard navigation and action execution
 * - Real-time communication via WebSocket
 */
@Module({
  providers: [
    AIService,
    AIGateway,
    OllamaService,
    VectorStoreService,
    DataAgentService,
    NavigationAgentService,
    ActionAgentService,
    PrismaService,
  ],
  exports: [AIService],
})
export class AIModule {}
