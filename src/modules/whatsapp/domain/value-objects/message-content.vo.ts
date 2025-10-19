/**
 * Value Object: MessageContent
 * Representa o conteúdo de uma mensagem com validações
 */
export class MessageContent {
  private static readonly MAX_LENGTH = 4096; // Limite WhatsApp

  private constructor(private readonly value: string) {}

  static create(content: string): MessageContent {
    if (!content || content.trim().length === 0) {
      throw new Error('Conteúdo da mensagem não pode ser vazio');
    }

    if (content.length > this.MAX_LENGTH) {
      throw new Error(`Mensagem excede o limite de ${this.MAX_LENGTH} caracteres`);
    }

    return new MessageContent(content.trim());
  }

  getValue(): string {
    return this.value;
  }

  getLength(): number {
    return this.value.length;
  }

  containsCommand(): boolean {
    return this.value.startsWith('/');
  }

  extractCommand(): string | null {
    if (!this.containsCommand()) {
      return null;
    }

    const parts = this.value.split(' ');
    return parts[0];
  }

  extractCommandArgs(): string[] {
    if (!this.containsCommand()) {
      return [];
    }

    const parts = this.value.split(' ');
    return parts.slice(1);
  }

  /**
   * Sanitiza conteúdo para evitar injeções
   */
  sanitize(): string {
    return this.value
      .replace(/[<>]/g, '') // Remove < >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }
}
