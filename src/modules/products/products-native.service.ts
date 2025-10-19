import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './application/dtos/create-product.dto';
import * as path from 'path';

// Interface TypeScript para o addon C++
interface NativeProductsAddon {
  createProduct(dto: any): any;
  validatePrice(price: number): {
    valid: boolean;
    value?: number;
    formatted?: string;
    error?: string;
  };
  validateStock(stock: number): {
    valid: boolean;
    value?: number;
    isZero?: boolean;
    isLow?: boolean;
    error?: string;
  };
  calculateDiscount(
    price: number,
    percentage: number,
  ): { originalPrice: number; discountedPrice: number; discount: number; percentage: number };
}

/**
 * Service que usa C++ nativo para lógica de domínio
 * Performance extrema onde precisa!
 */
@Injectable()
export class ProductsNativeService implements OnModuleInit {
  private readonly logger = new Logger(ProductsNativeService.name);
  private nativeAddon: NativeProductsAddon;
  private isAddonAvailable = false;

  onModuleInit() {
    try {
      // Tentar carregar o addon C++ compilado
      const addonPath = path.join(__dirname, 'native', 'build', 'Release', 'products.node');
      this.nativeAddon = require(addonPath);
      this.isAddonAvailable = true;
      this.logger.log('✅ C++ Native Addon carregado com sucesso!');
    } catch (error) {
      this.logger.warn('⚠️  C++ Native Addon não encontrado. Compile com: npm run build:native');
      this.logger.warn(`Erro: ${error.message}`);
      this.isAddonAvailable = false;
    }
  }

  /**
   * Verificar se o addon C++ está disponível
   */
  isNativeAvailable(): boolean {
    return this.isAddonAvailable;
  }

  /**
   * Criar produto usando C++ nativo (DDD puro em C++)
   */
  async createProductNative(dto: CreateProductDto, clientId: string) {
    if (!this.isAddonAvailable) {
      throw new Error('C++ Native Addon não está disponível. Execute: npm run build:native');
    }

    this.logger.log(`🚀 Criando produto via C++ nativo: ${dto.name}`);

    const startTime = Date.now();

    try {
      // Chama C++ como se fosse função TypeScript!
      // Zero overhead, zero latência de rede
      const product = this.nativeAddon.createProduct({
        clientId,
        name: dto.name,
        description: dto.description || '',
        sku: dto.sku || '',
        price: dto.price,
        stock: dto.stock || 0,
        categoryId: dto.categoryId || '',
        image: dto.image || '',
      });

      const executionTime = Date.now() - startTime;
      this.logger.log(`⚡ Produto criado em ${executionTime}ms (C++ nativo)`);
      this.logger.debug(`Domain Events: ${JSON.stringify(product.domainEvents)}`);

      return {
        success: true,
        data: product,
        message: 'Produto criado com sucesso (C++ Engine)',
        executionTime: `${executionTime}ms`,
        engine: 'C++',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar produto (C++): ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar preço usando C++ (regras de domínio)
   */
  validatePrice(price: number): {
    valid: boolean;
    value?: number;
    formatted?: string;
    error?: string;
  } {
    if (!this.isAddonAvailable) {
      // Fallback para validação TypeScript
      if (price < 0) {
        return { valid: false, error: 'Preço não pode ser negativo' };
      }
      if (price > 1000000) {
        return { valid: false, error: 'Preço excede limite máximo' };
      }
      return { valid: true, value: price, formatted: `R$ ${price.toFixed(2)}` };
    }

    return this.nativeAddon.validatePrice(price);
  }

  /**
   * Validar estoque usando C++
   */
  validateStock(stock: number): {
    valid: boolean;
    value?: number;
    isZero?: boolean;
    isLow?: boolean;
    error?: string;
  } {
    if (!this.isAddonAvailable) {
      // Fallback para validação TypeScript
      if (stock < 0) {
        return { valid: false, error: 'Estoque não pode ser negativo' };
      }
      return {
        valid: true,
        value: stock,
        isZero: stock === 0,
        isLow: stock > 0 && stock <= 10,
      };
    }

    return this.nativeAddon.validateStock(stock);
  }

  /**
   * Calcular desconto usando C++
   */
  calculateDiscount(price: number, percentage: number) {
    if (!this.isAddonAvailable) {
      // Fallback para cálculo TypeScript
      const discount = price * (percentage / 100);
      return {
        originalPrice: price,
        discountedPrice: price - discount,
        discount,
        percentage,
      };
    }

    return this.nativeAddon.calculateDiscount(price, percentage);
  }

  /**
   * Benchmark: Comparar performance C++ vs TypeScript
   */
  async benchmark(iterations: number = 10000) {
    this.logger.log(`🔬 Rodando benchmark com ${iterations} iterações...`);

    // Benchmark TypeScript
    const tsStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      const price = 100 + Math.random() * 1000;
      if (price < 0 || price > 1000000) continue;
      const discount = price * 0.1;
    }
    const tsTime = Date.now() - tsStart;

    // Benchmark C++ (se disponível)
    let cppTime = 0;
    if (this.isAddonAvailable) {
      const cppStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        const price = 100 + Math.random() * 1000;
        try {
          this.nativeAddon.validatePrice(price);
        } catch (e) {
          // ignore
        }
      }
      cppTime = Date.now() - cppStart;
    }

    const result = {
      iterations,
      typescript: {
        time: `${tsTime}ms`,
        perOperation: `${(tsTime / iterations).toFixed(4)}ms`,
      },
      cpp: this.isAddonAvailable
        ? {
            time: `${cppTime}ms`,
            perOperation: `${(cppTime / iterations).toFixed(4)}ms`,
            speedup: `${(tsTime / cppTime).toFixed(2)}x mais rápido`,
          }
        : 'Not available',
    };

    this.logger.log(`📊 Benchmark Results: ${JSON.stringify(result, null, 2)}`);
    return result;
  }
}

