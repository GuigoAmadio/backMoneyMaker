import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { OllamaService } from './ollama.service';

/**
 * Vector Store Service
 *
 * Manages the ChromaDB vector database for semantic search
 * Stores embeddings of documentation, data schemas, and common queries
 */
@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private client: ChromaClient;
  private collection: Collection;
  private readonly collectionName = 'moneymaker_knowledge';

  constructor(private readonly ollamaService: OllamaService) {
    this.client = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000',
    });
  }

  async onModuleInit() {
    await this.initializeCollection();
  }

  /**
   * Initialize or get the collection
   */
  private async initializeCollection() {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
      });
      this.logger.log(`Collection '${this.collectionName}' initialized`);
    } catch (error) {
      this.logger.error(`Failed to initialize collection: ${error.message}`);
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(
    documents: Array<{
      id: string;
      text: string;
      metadata: Record<string, any>;
    }>,
  ): Promise<void> {
    try {
      const embeddings = await Promise.all(
        documents.map((doc) => this.ollamaService.generateEmbeddings(doc.text)),
      );

      await this.collection.add({
        ids: documents.map((doc) => doc.id),
        documents: documents.map((doc) => doc.text),
        embeddings,
        metadatas: documents.map((doc) => doc.metadata),
      });

      this.logger.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      this.logger.error(`Failed to add documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Query similar documents
   */
  async query(
    queryText: string,
    topK = 5,
  ): Promise<
    Array<{
      id: string;
      text: string;
      metadata: Record<string, any>;
      distance: number;
    }>
  > {
    try {
      const queryEmbedding = await this.ollamaService.generateEmbeddings(queryText);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
      });

      return results.ids[0].map((id, index) => ({
        id,
        text: results.documents[0][index] as string,
        metadata: results.metadatas[0][index] as Record<string, any>,
        distance: results.distances?.[0]?.[index] || 0,
      }));
    } catch (error) {
      this.logger.error(`Failed to query vector store: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete documents by IDs
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.collection.delete({
        ids,
      });
      this.logger.log(`Deleted ${ids.length} documents from vector store`);
    } catch (error) {
      this.logger.error(`Failed to delete documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear all documents from collection
   */
  async clearCollection(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      await this.initializeCollection();
      this.logger.log('Collection cleared and reinitialized');
    } catch (error) {
      this.logger.error(`Failed to clear collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{ count: number }> {
    try {
      const count = await this.collection.count();
      return { count };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      throw error;
    }
  }
}
