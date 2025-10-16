import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { VectorStoreService } from './vector-store.service';
import { DataAgentService } from './agents/data-agent.service';
import { NavigationAgentService } from './agents/navigation-agent.service';
import { ActionAgentService } from './agents/action-agent.service';
import { ChatMessageDto, AIResponseDto } from '../dto/chat-message.dto';

/**
 * AI Service
 *
 * Main service that orchestrates the AI assistant
 * Coordinates between LLM, vector store, and various agents
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly systemPrompt = `Você é um assistente inteligente para o aplicativo MoneyMaker dashboard.

REGRAS FUNDAMENTAIS:
1. SEMPRE responda em PORTUGUÊS BRASILEIRO
2. SEMPRE inclua uma ação ACTION: quando o usuário pedir navegação ou ações
3. Seja direto e útil
4. NUNCA use templates genéricos em inglês
5. SEMPRE complete o JSON da ação com todos os fechamentos de chaves }}

CAPACIDADES DISPONÍVEIS:
- Navegar para páginas do dashboard
- Abrir modais de criação/edição
- Consultar dados do sistema
- Executar operações CRUD

FORMATO DE AÇÕES (OBRIGATÓRIO - JSON COMPLETO):
ACTION: {"type": "navigate", "payload": {"route": "/creator/products"}}
ACTION: {"type": "open-modal", "payload": {"modal": "create-product"}}
ACTION: {"type": "execute-action", "payload": {"action": "create", "entity": "product"}}
ACTION: {"type": "show-data", "payload": {"data": {}}}

⚠️ IMPORTANTE: O JSON da ação DEVE estar COMPLETO com todas as chaves fechadas }}

TIPOS DE AÇÃO VÁLIDOS:
- "navigate" - para navegação
- "open-modal" - para abrir modais
- "execute-action" - para executar operações
- "show-data" - para mostrar dados

ROTAS DISPONÍVEIS:
- /creator/products - Produtos
- /creator/clients - Clientes
- /creator/schedule - Agendamentos
- /creator/orders - Pedidos
- /creator/finances - Finanças
- /creator/analytics - Análises

MODAIS DISPONÍVEIS:
- create-product, edit-product
- create-client, edit-client
- create-appointment, edit-appointment

EXEMPLOS DE RESPOSTAS CORRETAS:

Usuário: "Leve-me para produtos"
Resposta: "Vou levar você para a página de produtos.
ACTION: {"type": "navigate", "payload": {"route": "/creator/products"}}"

Usuário: "Mostre análises"
Resposta: "Vou levar você para a página de análises.
ACTION: {"type": "navigate", "payload": {"route": "/creator/analytics"}}"

Usuário: "Crie um novo produto"
Resposta: "Vou abrir o modal para criar um novo produto.
ACTION: {"type": "open-modal", "payload": {"modal": "create-product"}}"

Lembre-se: 
- SEMPRE responda em português
- SEMPRE inclua ACTION: quando apropriado
- SEMPRE complete o JSON com }} no final`;

  private conversations = new Map<
    string,
    Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  >();

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly vectorStore: VectorStoreService,
    private readonly dataAgent: DataAgentService,
    private readonly navigationAgent: NavigationAgentService,
    private readonly actionAgent: ActionAgentService,
  ) {}

  /**
   * Process a chat message and generate a response
   */
  async processMessage(
    message: ChatMessageDto,
    userId: string,
    clientId: string,
  ): Promise<AIResponseDto> {
    try {
      const conversationId = message.conversationId || this.generateConversationId();

      // Get or create conversation history
      let conversation = this.conversations.get(conversationId);
      if (!conversation) {
        conversation = [{ role: 'system', content: this.systemPrompt }];
        this.conversations.set(conversationId, conversation);
      }

      // Add user message to conversation
      conversation.push({ role: 'user', content: message.message });

      // Query vector store for relevant context
      const relevantDocs = await this.vectorStore.query(message.message, 3);
      const context = relevantDocs.map((doc) => doc.text).join('\n\n');

      // Enrich message with context
      let enrichedMessage = message.message;
      if (context) {
        enrichedMessage = `Context:\n${context}\n\nUser question: ${message.message}`;
      }

      // Add current page context if available
      if (message.context?.currentRoute) {
        enrichedMessage += `\n\nUser is currently on: ${message.context.currentRoute}`;
      }

      // Check if user is asking for data
      const dataIntent = await this.detectDataIntent(message.message);
      if (dataIntent) {
        const data = await this.dataAgent.queryData(
          dataIntent.entity,
          dataIntent.filters,
          userId,
          clientId,
        );
        enrichedMessage += `\n\nRelevant data:\n${JSON.stringify(data, null, 2)}`;
      }

      // Generate response using LLM
      const lastMessages = conversation.slice(-10); // Keep last 10 messages for context
      lastMessages.push({ role: 'user', content: enrichedMessage });

      const aiResponse = await this.ollamaService.chat(lastMessages);

      // Parse action from response if present
      this.logger.debug(`🔍 AI Response: ${aiResponse}`);

      // Validate response quality
      if (this.isGenericEnglishResponse(aiResponse)) {
        this.logger.warn(`⚠️ AI returned generic English response, ignoring conversation history`);
        // Reset conversation and try again with fresh context
        const freshMessages = [
          { role: 'system' as const, content: this.systemPrompt },
          { role: 'user' as const, content: message.message },
        ];
        const freshResponse = await this.ollamaService.chat(freshMessages);
        this.logger.debug(`🔄 Fresh AI Response: ${freshResponse}`);

        const action = this.extractAction(freshResponse);
        const cleanResponse = this.removeActionFromResponse(freshResponse);

        this.logger.debug(`🎯 Action extracted: ${JSON.stringify(action)}`);
        this.logger.debug(`📝 Clean response: ${cleanResponse}`);

        const response = {
          message: cleanResponse,
          action,
          conversationId,
          timestamp: new Date(),
        };

        this.logger.debug(`📤 Final response: ${JSON.stringify(response)}`);
        return response;
      }

      const action = this.extractAction(aiResponse);
      const cleanResponse = this.removeActionFromResponse(aiResponse);

      this.logger.debug(`🎯 Action extracted: ${JSON.stringify(action)}`);
      this.logger.debug(`📝 Clean response: ${cleanResponse}`);

      // Add assistant response to conversation
      conversation.push({ role: 'assistant', content: cleanResponse });

      // Limit conversation history
      if (conversation.length > 50) {
        conversation = [
          conversation[0], // Keep system prompt
          ...conversation.slice(-49),
        ];
        this.conversations.set(conversationId, conversation);
      }

      const response = {
        message: cleanResponse,
        action,
        conversationId,
        timestamp: new Date(),
      };

      this.logger.debug(`📤 Final response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to process message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect if user is asking for data
   */
  private async detectDataIntent(
    message: string,
  ): Promise<{ entity: string; filters: any } | null> {
    const entities = ['products', 'clients', 'appointments', 'orders', 'finances', 'users'];

    const lowerMessage = message.toLowerCase();

    for (const entity of entities) {
      if (lowerMessage.includes(entity) || lowerMessage.includes(entity.slice(0, -1))) {
        return { entity, filters: {} };
      }
    }

    return null;
  }

  /**
   * Check if response is a generic English template
   */
  private isGenericEnglishResponse(response: string): boolean {
    const lowerResponse = response.toLowerCase();

    // Check for generic English patterns
    const genericPatterns = [
      'dear [user]',
      "i'm sorry to inform you",
      'please follow the instructions',
      'thank you for your cooperation',
      'best regards',
      '[your name]',
      '[page_or_section_link]',
      '[email]',
    ];

    const hasGenericPatterns = genericPatterns.some((pattern) => lowerResponse.includes(pattern));

    // Check if response is mostly in English and contains placeholders
    const hasPlaceholders = /\[[A-Z_]+\]/i.test(response);
    const isMostlyEnglish = /^[a-zA-Z\s\[\],.!?-]+$/.test(response.replace(/\n/g, ' '));

    return hasGenericPatterns || (hasPlaceholders && isMostlyEnglish);
  }

  /**
   * Extract action from AI response
   */
  private extractAction(response: string): AIResponseDto['action'] | undefined {
    this.logger.debug(`🔍 Extracting action from response: ${response.substring(0, 200)}...`);

    // First, try to find and fix incomplete JSON
    const actionMatch = response.match(
      /ACTION:\s*(\{[^}]*"type"\s*:\s*"[^"]+"\s*,\s*"payload"\s*:\s*\{[^}]*"[^"]+"\s*:\s*"[^"]+")([^}]*)/s,
    );
    if (actionMatch) {
      let jsonStr = actionMatch[1];
      this.logger.debug(`🔍 Found potential action JSON: ${jsonStr}`);

      // Count braces to fix incomplete JSON
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;

      if (missingBraces > 0) {
        jsonStr += '}}'.repeat(missingBraces);
        this.logger.debug(`🔧 Fixed JSON with ${missingBraces} missing braces: ${jsonStr}`);
      }

      try {
        const action = JSON.parse(jsonStr);

        // Validate action structure
        if (!action.type || !action.payload) {
          this.logger.warn(`⚠️ Invalid action structure: ${JSON.stringify(action)}`);
        } else {
          // Fix common typos in action types
          if (action.type === 'naviate') action.type = 'navigate';
          if (action.type === 'modal') action.type = 'open-modal';
          if (action.type === 'execute') action.type = 'execute-action';
          if (action.type === 'data') action.type = 'show-data';

          // Validate action type
          const validTypes = ['navigate', 'open-modal', 'execute-action', 'show-data'];
          if (validTypes.includes(action.type)) {
            this.logger.log(`✅ Action extracted successfully: ${JSON.stringify(action)}`);
            return action;
          }
        }
      } catch (error) {
        this.logger.debug(`⚠️ Failed to parse fixed JSON: ${error.message}`);
      }
    }

    // Try multiple patterns to find complete action
    const patterns = [
      // Standard ACTION: format with complete JSON
      /ACTION:\s*(\{[^}]*"type"[^}]*"payload"[^}]*\}\})/s,
      /ACTION:\s*(\{"type":"([^"]+)","payload":\{"route":"([^"]+)"\}\})/s,
      /ACTION:\s*(\{"type":"([^"]+)","payload":\{[^}]+\}\})/s,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = response.match(pattern);
      if (match) {
        this.logger.debug(`🎯 Pattern ${i + 1} matched: ${match[1]}`);
        try {
          let action = JSON.parse(match[1]);

          // Validate action structure
          if (!action.type || !action.payload) {
            this.logger.warn(`⚠️ Invalid action structure: ${JSON.stringify(action)}`);
            continue;
          }

          // Fix common typos in action types
          if (action.type === 'naviate') action.type = 'navigate';
          if (action.type === 'modal') action.type = 'open-modal';
          if (action.type === 'execute') action.type = 'execute-action';
          if (action.type === 'data') action.type = 'show-data';

          // Validate action type
          const validTypes = ['navigate', 'open-modal', 'execute-action', 'show-data'];
          if (!validTypes.includes(action.type)) {
            this.logger.warn(`⚠️ Invalid action type: ${action.type}`);
            continue;
          }

          this.logger.log(`✅ Action extracted successfully: ${JSON.stringify(action)}`);
          return action;
        } catch (error) {
          this.logger.error(
            `❌ Failed to parse action with pattern ${i + 1}: ${match[1]} - Error: ${error.message}`,
          );
        }
      }
    }

    // If no action found, try to detect navigation intent
    this.logger.debug(`🔍 No action found with patterns, trying intent detection...`);
    const lowerResponse = response.toLowerCase();
    if (
      lowerResponse.includes('navegar') ||
      lowerResponse.includes('ir para') ||
      lowerResponse.includes('levar') ||
      lowerResponse.includes('abrir')
    ) {
      // Try to detect route from response
      const routeMatch = response.match(/(\/[a-zA-Z0-9\-_\/]+)/);
      if (routeMatch) {
        const action = {
          type: 'navigate' as const,
          payload: { route: routeMatch[1] },
        };
        this.logger.log(`🧭 Navigation intent detected: ${JSON.stringify(action)}`);
        return action;
      }

      // Try to detect common route names in Portuguese
      const routeMappings: Record<string, string> = {
        produtos: '/creator/products',
        clientes: '/creator/clients',
        agendamentos: '/creator/schedule',
        pedidos: '/creator/orders',
        finanças: '/creator/finances',
        financas: '/creator/finances',
        análises: '/creator/analytics',
        analises: '/creator/analytics',
      };

      for (const [keyword, route] of Object.entries(routeMappings)) {
        if (lowerResponse.includes(keyword)) {
          const action = {
            type: 'navigate' as const,
            payload: { route },
          };
          this.logger.log(
            `🧭 Navigation intent detected by keyword "${keyword}": ${JSON.stringify(action)}`,
          );
          return action;
        }
      }
    }

    this.logger.debug(`❌ No action found in response`);
    return undefined;
  }

  /**
   * Remove action instruction from response
   */
  private removeActionFromResponse(response: string): string {
    this.logger.debug(`🧹 Cleaning response from action instructions...`);

    let cleaned = response;

    // Remove ACTION: patterns
    cleaned = cleaned.replace(/ACTION:\s*{.*?}/gs, '');
    cleaned = cleaned.replace(/ACTION:\s*\{.*?\}/gs, '');

    // Remove JSON action patterns
    cleaned = cleaned.replace(/"action":\s*{.*?}/gs, '');
    cleaned = cleaned.replace(/action:\s*{.*?}/gs, '');

    // Remove any remaining JSON objects that look like actions
    cleaned = cleaned.replace(
      /{\s*"type"\s*:\s*"(navigate|open-modal|execute-action|show-data)"\s*,\s*"payload"\s*:\s*{.*?}\s*}/gs,
      '',
    );

    // Clean up extra whitespace and newlines
    cleaned = cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
      .replace(/^\s+|\s+$/g, '') // Trim start/end
      .trim();

    this.logger.debug(
      `🧹 Response cleaned. Original length: ${response.length}, Cleaned length: ${cleaned.length}`,
    );

    return cleaned;
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Initialize knowledge base with system data
   */
  async initializeKnowledgeBase(clientId: string): Promise<void> {
    try {
      this.logger.log('Initializing knowledge base...');

      // Add documentation about entities
      const docs = [
        {
          id: 'doc_products',
          text: 'Products: Manage inventory items. Fields: name, description, price, stock, category, isActive. Operations: create, read, update, delete, search.',
          metadata: { type: 'entity', entity: 'products' },
        },
        {
          id: 'doc_clients',
          text: 'Clients: Manage customer information. Fields: name, email, phone, address, activeServices. Operations: create, read, update, delete, search.',
          metadata: { type: 'entity', entity: 'clients' },
        },
        {
          id: 'doc_appointments',
          text: 'Appointments: Schedule and manage appointments. Fields: title, date, startTime, endTime, clientId, status. Operations: create, read, update, delete, reschedule.',
          metadata: { type: 'entity', entity: 'appointments' },
        },
        {
          id: 'doc_orders',
          text: 'Orders: Manage customer orders. Fields: clientId, products, total, status, paymentMethod. Operations: create, read, update, cancel.',
          metadata: { type: 'entity', entity: 'orders' },
        },
        {
          id: 'doc_finances',
          text: 'Finances: Track financial transactions. Fields: type (income/expense), amount, category, date, description. Operations: create, read, update, delete, analytics.',
          metadata: { type: 'entity', entity: 'finances' },
        },
      ];

      await this.vectorStore.addDocuments(docs);
      this.logger.log('Knowledge base initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize knowledge base: ${error.message}`);
      throw error;
    }
  }
}
