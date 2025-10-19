/**
 * Value Object: PhoneNumber
 * Representa um número de telefone validado no formato WhatsApp
 */
export class PhoneNumber {
  private constructor(private readonly value: string) {}

  static create(phoneNumber: string): PhoneNumber {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error('Número de telefone inválido. Deve ter entre 10 e 15 dígitos.');
    }

    // Formato WhatsApp: código país + DDD + número
    // Exemplo: 5511999999999 (Brasil)
    return new PhoneNumber(cleaned);
  }

  getValue(): string {
    return this.value;
  }

  /**
   * Retorna no formato WhatsApp API
   * Exemplo: "5511999999999"
   */
  toWhatsAppFormat(): string {
    return this.value;
  }

  /**
   * Retorna formatado para exibição
   * Exemplo: "+55 11 99999-9999"
   */
  toDisplayFormat(): string {
    if (this.value.startsWith('55') && this.value.length === 13) {
      // Formato Brasil
      const ddd = this.value.substring(2, 4);
      const part1 = this.value.substring(4, 9);
      const part2 = this.value.substring(9);
      return `+55 ${ddd} ${part1}-${part2}`;
    }
    return `+${this.value}`;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
