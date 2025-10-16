# 🎯 Exemplos Práticos de Testes de Rotas

Este arquivo contém exemplos prontos para usar de testes de rotas comuns.

## 🚀 Quick Start

```bash
# 1. Certifique-se de que o backend está rodando
docker-compose up -d

# 2. Execute os testes
npm run test:routes
```

## 📋 Exemplos de Uso da Função `testRoute()`

### Exemplo 1: Rota Pública Simples

```typescript
await testRoute({
  name: 'Health Check',
  method: 'GET',
  path: '/health',
  requiresAuth: false,
  expectedStatus: 200,
});
```

### Exemplo 2: Rota Autenticada (USER)

```typescript
await testRoute({
  name: 'Buscar Perfil',
  method: 'GET',
  path: '/api/v1/auth/me',
  requiresAuth: true,
  userRole: 'USER',
  clientId: testClientId1,
  expectedStatus: 200,
});
```

### Exemplo 3: Criar Recurso (ADMIN)

```typescript
await testRoute({
  name: 'Criar Produto',
  method: 'POST',
  path: '/api/v1/products',
  requiresAuth: true,
  userRole: 'ADMIN',
  clientId: testClientId1,
  body: {
    name: 'Produto Novo',
    price: 99.99,
    description: 'Descrição do produto',
    stock: 100,
  },
  expectedStatus: 201,
});
```

### Exemplo 4: Atualizar Recurso (ADMIN)

```typescript
await testRoute({
  name: 'Atualizar Produto',
  method: 'PUT',
  path: '/api/v1/products/123',
  requiresAuth: true,
  userRole: 'ADMIN',
  clientId: testClientId1,
  body: {
    name: 'Produto Atualizado',
    price: 149.99,
  },
  expectedStatus: 200,
});
```

### Exemplo 5: Deletar Recurso (ADMIN)

```typescript
await testRoute({
  name: 'Deletar Produto',
  method: 'DELETE',
  path: '/api/v1/products/123',
  requiresAuth: true,
  userRole: 'ADMIN',
  clientId: testClientId1,
  expectedStatus: 200,
});
```

### Exemplo 6: Listar com Filtros

```typescript
await testRoute({
  name: 'Listar Produtos com Filtro',
  method: 'GET',
  path: '/api/v1/products?category=electronics&minPrice=50',
  requiresAuth: true,
  userRole: 'USER',
  clientId: testClientId1,
  expectedStatus: 200,
});
```

### Exemplo 7: SUPER_ADMIN Impersonando Outro Cliente

```typescript
await testRoute({
  name: 'SUPER_ADMIN Lista Usuários de Outro Cliente',
  method: 'GET',
  path: '/api/v1/users',
  requiresAuth: true,
  userRole: 'SUPER_ADMIN',
  impersonate: testClientId1, // Impersonando Client 1
  expectedStatus: 200,
});
```

### Exemplo 8: Testar Erro de Validação

```typescript
await testRoute({
  name: 'Criar Produto sem Nome (deve falhar)',
  method: 'POST',
  path: '/api/v1/products',
  requiresAuth: true,
  userRole: 'ADMIN',
  clientId: testClientId1,
  body: {
    price: 99.99,
    // name está faltando
  },
  expectedStatus: 400, // Bad Request
});
```

### Exemplo 9: Testar Acesso Negado (403)

```typescript
await testRoute({
  name: 'USER Tentando Deletar (sem permissão)',
  method: 'DELETE',
  path: '/api/v1/products/123',
  requiresAuth: true,
  userRole: 'USER', // Apenas ADMIN pode deletar
  clientId: testClientId1,
  expectedStatus: 403, // Forbidden
});
```

### Exemplo 10: Testar Recurso Não Encontrado (404)

```typescript
await testRoute({
  name: 'Buscar Produto Inexistente',
  method: 'GET',
  path: '/api/v1/products/99999',
  requiresAuth: true,
  userRole: 'USER',
  clientId: testClientId1,
  expectedStatus: 404, // Not Found
});
```

## 🔐 Exemplos de Testes de Segurança

### Teste 1: Sem Token (deve falhar)

```typescript
const response = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401); // Unauthorized
```

### Teste 2: Token Inválido (deve falhar)

```typescript
const response = await request(app.getHttpServer())
  .get('/api/v1/auth/me')
  .set('Authorization', 'Bearer token_invalido')
  .expect(401);
```

### Teste 3: Acesso Cruzado Entre Clientes (deve falhar)

```typescript
const user1 = Array.from(testUsers.values()).find(
  (u) => u.clientId === testClientId1 && u.role === 'USER',
);

// User do Client 1 tentando acessar dados do Client 2
const response = await request(app.getHttpServer())
  .get('/api/v1/users')
  .set('Authorization', `Bearer ${user1.token}`)
  .set('x-client-id', testClientId2) // Client diferente!
  .expect(403); // Forbidden
```

### Teste 4: USER Não Pode Impersonar (deve falhar)

```typescript
const user = Array.from(testUsers.values()).find((u) => u.role === 'USER');

const response = await request(app.getHttpServer())
  .get('/api/v1/users')
  .set('Authorization', `Bearer ${user.token}`)
  .set('x-client-id', testClientId2) // Tentando impersonar
  .expect(403);
```

## 🎨 Exemplos de Testes Completos (CRUD)

### Teste Completo: CRUD de Produtos

```typescript
describe('CRUD de Produtos', () => {
  let productId: string;

  it('deve criar um produto', async () => {
    const response = await testRoute({
      name: 'Criar Produto',
      method: 'POST',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      body: {
        name: 'Notebook',
        price: 2999.99,
        description: 'Notebook de alta performance',
        stock: 10,
        category: 'electronics',
      },
      expectedStatus: 201,
    });

    productId = response.body.id;
    expect(productId).toBeDefined();
  });

  it('deve listar produtos', async () => {
    const response = await testRoute({
      name: 'Listar Produtos',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('deve buscar produto específico', async () => {
    const response = await testRoute({
      name: 'Buscar Produto',
      method: 'GET',
      path: `/api/v1/products/${productId}`,
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    expect(response.body.id).toBe(productId);
    expect(response.body.name).toBe('Notebook');
  });

  it('deve atualizar produto', async () => {
    const response = await testRoute({
      name: 'Atualizar Produto',
      method: 'PUT',
      path: `/api/v1/products/${productId}`,
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      body: {
        name: 'Notebook Pro',
        price: 3499.99,
      },
      expectedStatus: 200,
    });

    expect(response.body.name).toBe('Notebook Pro');
    expect(response.body.price).toBe(3499.99);
  });

  it('deve deletar produto', async () => {
    await testRoute({
      name: 'Deletar Produto',
      method: 'DELETE',
      path: `/api/v1/products/${productId}`,
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      expectedStatus: 200,
    });
  });

  it('não deve encontrar produto deletado', async () => {
    await testRoute({
      name: 'Buscar Produto Deletado',
      method: 'GET',
      path: `/api/v1/products/${productId}`,
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 404,
    });
  });
});
```

## 🏢 Exemplos de Multi-Tenancy

### Teste: Isolamento de Dados Entre Clientes

```typescript
describe('Multi-Tenancy - Isolamento de Dados', () => {
  let productClient1: string;
  let productClient2: string;

  it('deve criar produto no Client 1', async () => {
    const response = await testRoute({
      name: 'Criar Produto Client 1',
      method: 'POST',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      body: { name: 'Produto Client 1', price: 100 },
      expectedStatus: 201,
    });

    productClient1 = response.body.id;
  });

  it('deve criar produto no Client 2', async () => {
    const response = await testRoute({
      name: 'Criar Produto Client 2',
      method: 'POST',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId2,
      body: { name: 'Produto Client 2', price: 200 },
      expectedStatus: 201,
    });

    productClient2 = response.body.id;
  });

  it('Client 1 deve ver apenas seus produtos', async () => {
    const response = await testRoute({
      name: 'Listar Produtos Client 1',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    const productIds = response.body.map((p) => p.id);
    expect(productIds).toContain(productClient1);
    expect(productIds).not.toContain(productClient2);
  });

  it('Client 2 deve ver apenas seus produtos', async () => {
    const response = await testRoute({
      name: 'Listar Produtos Client 2',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId2,
      expectedStatus: 200,
    });

    const productIds = response.body.map((p) => p.id);
    expect(productIds).toContain(productClient2);
    expect(productIds).not.toContain(productClient1);
  });

  it('SUPER_ADMIN deve ver produtos de todos os clientes', async () => {
    // Ver produtos do Client 1
    const response1 = await testRoute({
      name: 'SUPER_ADMIN vê Client 1',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'SUPER_ADMIN',
      impersonate: testClientId1,
      expectedStatus: 200,
    });

    const ids1 = response1.body.map((p) => p.id);
    expect(ids1).toContain(productClient1);

    // Ver produtos do Client 2
    const response2 = await testRoute({
      name: 'SUPER_ADMIN vê Client 2',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'SUPER_ADMIN',
      impersonate: testClientId2,
      expectedStatus: 200,
    });

    const ids2 = response2.body.map((p) => p.id);
    expect(ids2).toContain(productClient2);
  });
});
```

## 📊 Exemplos de Testes de Performance

```typescript
describe('Performance', () => {
  it('deve responder em menos de 500ms', async () => {
    const startTime = Date.now();

    await testRoute({
      name: 'Performance Test',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
    console.log(`   ⚡ Tempo de resposta: ${responseTime}ms`);
  });

  it('deve processar 50 requisições simultâneas', async () => {
    const promises = [];
    const numRequests = 50;

    for (let i = 0; i < numRequests; i++) {
      promises.push(
        testRoute({
          name: `Request ${i}`,
          method: 'GET',
          path: '/api/v1/products',
          requiresAuth: true,
          userRole: 'USER',
          clientId: testClientId1,
          expectedStatus: 200,
        }),
      );
    }

    const startTime = Date.now();
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    console.log(`   ⚡ ${numRequests} requisições em ${totalTime}ms`);
    console.log(`   ⚡ Média: ${(totalTime / numRequests).toFixed(2)}ms por requisição`);
  });
});
```

## 🔄 Exemplo Completo: Fluxo de E-commerce

```typescript
describe('Fluxo Completo: E-commerce', () => {
  let userId: string;
  let productId: string;
  let orderId: string;

  it('1. Usuário faz login', async () => {
    const response = await testRoute({
      name: 'Login',
      method: 'POST',
      path: '/api/v1/auth/login',
      requiresAuth: false,
      body: {
        email: 'user1@test.com',
        password: 'Test123!@#',
      },
      expectedStatus: 200,
    });

    expect(response.body.access_token).toBeDefined();
  });

  it('2. Admin cria produto', async () => {
    const response = await testRoute({
      name: 'Criar Produto',
      method: 'POST',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      body: {
        name: 'Mouse Gamer',
        price: 199.99,
        stock: 50,
      },
      expectedStatus: 201,
    });

    productId = response.body.id;
  });

  it('3. Usuário busca produtos', async () => {
    const response = await testRoute({
      name: 'Listar Produtos',
      method: 'GET',
      path: '/api/v1/products',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    expect(response.body.find((p) => p.id === productId)).toBeDefined();
  });

  it('4. Usuário cria pedido', async () => {
    const response = await testRoute({
      name: 'Criar Pedido',
      method: 'POST',
      path: '/api/v1/orders',
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      body: {
        items: [
          {
            productId: productId,
            quantity: 2,
          },
        ],
      },
      expectedStatus: 201,
    });

    orderId = response.body.id;
    expect(response.body.total).toBe(399.98); // 2 x 199.99
  });

  it('5. Usuário consulta seu pedido', async () => {
    const response = await testRoute({
      name: 'Buscar Pedido',
      method: 'GET',
      path: `/api/v1/orders/${orderId}`,
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    expect(response.body.id).toBe(orderId);
    expect(response.body.status).toBe('pending');
  });

  it('6. Admin confirma pedido', async () => {
    await testRoute({
      name: 'Confirmar Pedido',
      method: 'PATCH',
      path: `/api/v1/orders/${orderId}/confirm`,
      requiresAuth: true,
      userRole: 'ADMIN',
      clientId: testClientId1,
      expectedStatus: 200,
    });
  });

  it('7. Verificar estoque foi reduzido', async () => {
    const response = await testRoute({
      name: 'Verificar Estoque',
      method: 'GET',
      path: `/api/v1/products/${productId}`,
      requiresAuth: true,
      userRole: 'USER',
      clientId: testClientId1,
      expectedStatus: 200,
    });

    expect(response.body.stock).toBe(48); // 50 - 2
  });
});
```

---

**💡 Dica**: Copie e adapte esses exemplos para suas rotas específicas! Basta mudar os caminhos, métodos e bodies conforme necessário.
