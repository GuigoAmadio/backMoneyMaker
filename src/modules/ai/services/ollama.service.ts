import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';

/**
 * Ollama Service
 *
 * Manages communication with Ollama for LLM inference
 * Uses Llama 3.1 model for natural language understanding
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private ollama: Ollama;
  private readonly model = process.env.OLLAMA_MODEL || 'tinyllama';

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    });
  }

  /**
   * Generate a completion from the LLM
   */
  async generateCompletion(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        system: systemPrompt,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 500,
        },
      });

      return response.response;
    } catch (error) {
      this.logger.error(`Failed to generate completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a chat completion with conversation history
   */
  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 500,
        },
      });

      return response.message.content;
    } catch (error) {
      this.logger.error(`Failed to generate chat completion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text,
      });

      return response.embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embeddings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      this.logger.error(`Ollama health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Pull model if not available
   */
  async ensureModel(): Promise<void> {
    try {
      const models = await this.ollama.list();
      const hasModel = models.models.some((m) => m.name === this.model);

      if (!hasModel) {
        this.logger.log(`Pulling model ${this.model}...`);
        await this.ollama.pull({ model: this.model });
        this.logger.log(`Model ${this.model} pulled successfully`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure model: ${error.message}`);
      throw error;
    }
  }
}
