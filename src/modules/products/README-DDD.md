# Módulo Products - Arquitetura DDD

## 📋 Visão Geral

Este módulo foi migrado de uma arquitetura em camadas (Layered) para DDD (Domain-Driven Design). A estrutura foi reorganizada para seguir os princípios do DDD, com separação clara de responsabilidades entre as camadas.

## 🏗️ Estrutura de Diretórios

```
products/
├── domain/                           # Camada de Domínio (regras de negócio)
│   ├── entities/
│   │   └── product.entity.ts        # Entidade rica com comportamento
│   ├── value-objects/
│   │   ├── price.vo.ts              # Valor de preço com validações
│   │   ├── stock.vo.ts              # Valor de estoque com lógica
│   │   └── product-status.vo.ts     # Status do produto
│   ├── repositories/
│   │   └── product.repository.interface.ts  # Contrato do repositório
│   └── events/
│       ├── product-created.event.ts
│       ├── stock-updated.event.ts
│       ├── low-stock.event.ts
│       └── product-deactivated.event.ts
│
├── application/                      # Camada de Aplicação (casos de uso)
│   ├── use-cases/
│   │   ├── create-product/
│   │   │   └── create-product.use-case.ts
│   │   ├── update-product/
│   │   │   └── update-product.use-case.ts
│   │   ├── update-stock/
│   │   │   └── update-stock.use-case.ts
│   │   ├── find-product/
│   │   │   └── find-product.use-case.ts
│   │   └── get-low-stock/
│   │       └── get-low-stock-products.use-case.ts
│   └── dtos/
│       ├── create-product.dto.ts
│       ├── update-product.dto.ts
│       └── update-stock.dto.ts
│
├── infrastructure/                   # Camada de Infraestrutura
│   └── persistence/
│       ├── product.repository.ts    # Implementação do repositório
│       └── product.prisma.mapper.ts # Mapper Prisma ↔ Domain
│
├── presentation/                     # Camada de Apresentação
│   └── products.controller.ts       # Controller com Use Cases
│
├── products.service.ts              # Service legado (temporário)
└── products.module.ts               # Configuração do módulo
```

## 🎯 Camadas e Responsabilidades

### 1. Domain (Domínio)

**Responsabilidade**: Conter a lógica de negócio pura, sem dependências externas.

#### Entities (Entidades)

- `Product`: Entidade rica com comportamento
  - Métodos: `update()`, `updateStock()`, `updatePrice()`, `deactivate()`, `activate()`
  - Validações de negócio embutidas
  - Gerencia eventos de domínio

#### Value Objects (Objetos de Valor)

- `Price`: Encapsula lógica de preço
  - Validações: não pode ser negativo, limite máximo
  - Métodos: `calculateDiscount()`, `isLessThan()`, etc.
- `Stock`: Encapsula lógica de estoque
  - Validações: não pode ser negativo
  - Métodos: `add()`, `subtract()`, `isLow()`, `hasSufficient()`
- `ProductStatus`: Encapsula status do produto (ativo/inativo)

#### Domain Events

- `ProductCreatedEvent`: Disparado quando produto é criado
- `StockUpdatedEvent`: Disparado quando estoque é alterado
- `LowStockEvent`: Disparado quando estoque fica baixo
- `ProductDeactivatedEvent`: Disparado quando produto é desativado

#### Repository Interface

- Define o contrato para persistência
- Não depende de implementação específica (Prisma, TypeORM, etc.)

### 2. Application (Aplicação)

**Responsabilidade**: Orquestrar casos de uso, coordenar entidades e repositórios.

#### Use Cases

Cada caso de uso é uma classe independente:

1. **CreateProductUseCase**
   - Valida categoria
   - Cria entidade Product
   - Persiste via repositório
   - Publica eventos

2. **UpdateProductUseCase**
   - Busca produto existente
   - Valida categoria (se alterada)
   - Atualiza informações
   - Persiste mudanças
   - Publica eventos

3. **UpdateStockUseCase**
   - Busca produto
   - Usa método de domínio `updateStock()`
   - Persiste
   - Publica eventos (incluindo LowStockEvent)

4. **FindProductUseCase**
   - Busca produto
   - Enriquece com estatísticas de vendas
   - Retorna dados formatados

5. **GetLowStockProductsUseCase**
   - Lista produtos com estoque baixo
   - Usa repositório diretamente (query)

### 3. Infrastructure (Infraestrutura)

**Responsabilidade**: Implementar interfaces definidas no domínio usando tecnologias específicas.

#### ProductRepository

- Implementa `IProductRepository`
- Usa Prisma para persistência
- Métodos: `save()`, `findById()`, `findAll()`, `delete()`, etc.

#### ProductPrismaMapper

- Converte entre Prisma Model ↔ Domain Entity
- `toDomain()`: Prisma → Domain
- `toPrisma()`: Domain → Prisma
- `toPrismaCreate()`: Para criação
- `toPrismaUpdate()`: Para atualização

### 4. Presentation (Apresentação)

**Responsabilidade**: Expor API HTTP, validar entrada, formatar saída.

#### ProductsController

- Injeta Use Cases
- Valida DTOs
- Gerencia cache
- Retorna respostas HTTP padronizadas

## 🔄 Fluxo de Execução

### Exemplo: Criar Produto

```
1. HTTP POST /products
   ↓
2. ProductsController.create()
   ↓
3. CreateProductUseCase.execute()
   ↓
4. Product.create() → Entidade rica criada
   ↓
5. ProductRepository.save() → Persistência
   ↓
6. EventEmitter → Publica ProductCreatedEvent
   ↓
7. Retorna produto criado
```

### Exemplo: Atualizar Estoque

```
1. HTTP PATCH /products/:id/stock
   ↓
2. ProductsController.updateStock()
   ↓
3. UpdateStockUseCase.execute()
   ↓
4. ProductRepository.findById() → Busca produto
   ↓
5. product.updateStock() → Lógica de domínio
   ↓
6. Se estoque baixo → LowStockEvent disparado
   ↓
7. ProductRepository.save() → Persiste
   ↓
8. EventEmitter → Publica eventos
```

## 🎨 Vantagens da Arquitetura DDD

### 1. Separação de Preocupações

- Domínio não depende de infraestrutura
- Lógica de negócio centralizada
- Fácil de testar isoladamente

### 2. Testabilidade

```typescript
// Testar domínio sem banco de dados
const price = Price.create(100);
const stock = Stock.create(10);
const product = Product.create({ name: 'Test', price, stock, ... });
product.updateStock(5);
expect(product.stock.getValue()).toBe(5);
```

### 3. Manutenibilidade

- Mudanças de infraestrutura não afetam domínio
- Novos casos de uso são fáceis de adicionar
- Código autoexplicativo

### 4. Inversão de Dependência

```typescript
// Domain define a interface
interface IProductRepository { ... }

// Infrastructure implementa
class ProductRepository implements IProductRepository { ... }

// Application depende da interface, não da implementação
constructor(
  @Inject('IProductRepository')
  private readonly productRepository: IProductRepository
) {}
```

### 5. Domain Events

```typescript
// Eventos desacoplam módulos
product.updateStock(5); // Dispara LowStockEvent

// Outros módulos podem reagir
@OnEvent('LowStockEvent')
handleLowStock(event: LowStockEvent) {
  // Enviar email, notificação, etc.
}
```

## 📝 Comparação: Antes vs Depois

### Antes (Layered)

```typescript
// Service faz tudo
async updateStock(id: string, stock: number, clientId: string) {
  const product = await this.prisma.product.findFirst({ ... });
  if (!product) throw new NotFoundException();

  // Validações espalhadas
  if (stock < 0) throw new Error('Invalid stock');

  // Atualização direta no banco
  const updated = await this.prisma.product.update({ ... });

  // Cache manual
  await this.cacheService.invalidateByTags(['products']);

  return updated;
}
```

### Depois (DDD)

```typescript
// Use Case orquestra
async execute(productId: string, quantity: number, clientId: string) {
  const product = await this.productRepository.findById(productId, clientId);
  if (!product) throw new NotFoundException();

  // Lógica encapsulada na entidade
  product.updateStock(quantity); // Validações automáticas, eventos disparados

  await this.productRepository.save(product);

  // Eventos publicados automaticamente
  this.publishEvents(product.getDomainEvents());
}
```

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **CQRS (Command Query Responsibility Segregation)**
   - Separar comandos (write) de queries (read)
   - Criar Query Handlers para leitura otimizada

2. **Agregados**
   - Definir claramente os limites dos agregados
   - Product como Aggregate Root

3. **Especificações**
   - Criar pattern Specification para queries complexas
   - Ex: `ProductIsActiveSpecification`, `LowStockSpecification`

4. **Event Handlers**
   - Criar handlers para eventos de domínio
   - Ex: Enviar email quando estoque baixo

5. **Unit of Work**
   - Implementar pattern Unit of Work para transações

## 📚 Referências

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Implementing DDD (Vaughn Vernon)](https://vaughnvernon.com/)
- [NestJS Documentation](https://docs.nestjs.com/)

## ⚠️ Notas Importantes

### Migração Gradual

- O `ProductsService` antigo ainda existe (marcado como legado)
- Usado temporariamente para queries não migradas (stats)
- Pode ser removido quando todos os endpoints forem migrados

### Compatibilidade

- ✅ API externa permanece 100% compatível
- ✅ Endpoints não mudaram
- ✅ Frontend não precisa de alterações
- ✅ DTOs de resposta mantidos

### Performance

- Repository usa Prisma (mesma performance)
- Cache mantido nos mesmos lugares
- Domain events são síncronos (sem overhead)

## 🧪 Como Testar

```bash
# Instalar dependências (se necessário)
npm install @nestjs/event-emitter

# Compilar
npm run build

# Rodar testes
npm run test

# Iniciar servidor
npm run start:dev
```

## 📞 Suporte

Se tiver dúvidas sobre a arquitetura DDD implementada:

1. Consulte este README
2. Veja os comentários no código
3. Consulte a documentação do NestJS sobre DDD
