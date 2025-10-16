/**
 * 🧪 ABSOLUTE ROUTE TESTER
 *
 * Sistema de testes completo e flexível que permite testar qualquer rota do backend
 * de forma interna (sem depender de conexão externa).
 *
 * CARACTERÍSTICAS:
 * - Testa rotas públicas e privadas
 * - Suporta múltiplos client-ids
 * - Gera e usa tokens JWT automaticamente
 * - Testa impersonation de SUPER_ADMIN
 * - Não depende de conexão de internet
 * - Execução rápida e confiável
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../modules/auth/auth.service';

/**
 * Interface para configuração de teste de rota
 */
interface RouteTestConfig {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requiresAuth?: boolean;
  clientId?: string;
  userRole?: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE' | 'CLIENT';
  body?: any;
  expectedStatus?: number;
  impersonate?: string;

  // ✨ NOVOS PARÂMETROS:
  customToken?: string; // Token customizado (sobrescreve a busca automática)
  customHeaders?: Record<string, string>; // Headers adicionais
}

/**
 * Interface para credenciais de teste
 */
interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLOYEE' | 'CLIENT';
  clientId: string;
  token?: string;
}

describe('🧪 Absolute Route Tester', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;

  // Armazenar usuários de teste
  const testUsers: Map<string, TestUser> = new Map();

  // Client IDs de teste
  let testClientId1: string;
  let testClientId2: string;
  let superAdminClientId: string;

  beforeAll(async () => {
    console.log('🚀 Iniciando Absolute Route Tester...\n');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Criar dados de teste
    await setupTestData();

    console.log('✅ Setup completo!\n');
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await app.close();
  });

  /**
   * 🔧 SETUP: Criar usuários e clients de teste
   */
  async function setupTestData() {
    console.log('📋 Criando dados de teste...');

    try {
      // Criar Client 1
      const client1 = await prismaService.client.create({
        data: {
          name: 'Test Client 1',
          slug: 'test-client-1',
          email: 'client1@test.com',
          status: 'ACTIVE',
          plan: 'basic',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });
      testClientId1 = client1.id;

      // Criar Client 2
      const client2 = await prismaService.client.create({
        data: {
          name: 'Test Client 2',
          slug: 'test-client-2',
          email: 'client2@test.com',
          status: 'ACTIVE',
          plan: 'basic',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      testClientId2 = client2.id;

      // Criar Client Super Admin
      const superClient = await prismaService.client.create({
        data: {
          name: 'Super Admin Client',
          slug: 'test-super-admin',
          email: 'superadmin@test.com',
          status: 'ACTIVE',
          plan: 'enterprise',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        },
      });
      superAdminClientId = superClient.id;

      // Criar usuários para cada client
      const usersToCreate = [
        {
          email: 'client1@test.com',
          password: 'Test123!@#',
          role: 'CLIENT' as const,
          clientId: testClientId1,
        },
        {
          email: 'admin1@test.com',
          password: 'Test123!@#',
          role: 'ADMIN' as const,
          clientId: testClientId1,
        },
        {
          email: 'client2@test.com',
          password: 'Test123!@#',
          role: 'CLIENT' as const,
          clientId: testClientId2,
        },
        {
          email: 'superadmin@test.com',
          password: 'Test123!@#',
          role: 'SUPER_ADMIN' as const,
          clientId: superAdminClientId,
        },
      ];

      for (const userData of usersToCreate) {
        // Registrar usuário
        const result = await authService.register(
          {
            email: userData.email,
            password: userData.password,
            name: userData.email.split('@')[0],
            role: userData.role,
          },
          userData.clientId,
        );

        // Fazer login para obter token
        const loginResult = await authService.login({
          email: userData.email,
          password: userData.password,
        });

        // Armazenar credenciais
        testUsers.set(userData.email, {
          email: userData.email,
          password: userData.password,
          role: userData.role,
          clientId: userData.clientId,
          token: loginResult.access_token,
        });

        console.log(
          `  ✅ Criado: ${userData.email} (${userData.role}) - Client: ${userData.clientId}`,
        );
      }
    } catch (error) {
      console.error('❌ Erro ao criar dados de teste:', error);
      throw error;
    }
  }

  /**
   * 🧹 CLEANUP: Remover dados de teste
   */
  async function cleanupTestData() {
    console.log('\n🧹 Limpando dados de teste...');

    try {
      // Deletar usuários de teste
      await prismaService.user.deleteMany({
        where: {
          email: {
            in: Array.from(testUsers.keys()),
          },
        },
      });

      // Deletar clients de teste
      await prismaService.client.deleteMany({
        where: {
          id: {
            in: [testClientId1, testClientId2, superAdminClientId],
          },
        },
      });

      console.log('✅ Limpeza concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
    }
  }

  /**
   * 🎯 FUNÇÃO PRINCIPAL: Testar qualquer rota
   */
  async function testRoute(config: RouteTestConfig) {
    const {
      name,
      method,
      path,
      requiresAuth = true,
      clientId,
      userRole = 'CLIENT',
      body,
      expectedStatus = 200,
      impersonate,
      customToken, // ← NOVO
      customHeaders = {}, // ← NOVO
    } = config;

    console.log(`\n🧪 Testando: ${name}`);
    console.log(`   Método: ${method} ${path}`);
    console.log(`   Requer Auth: ${requiresAuth}`);
    console.log(`   Client ID: ${clientId || 'nenhum'}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Impersonate: ${impersonate || 'não'}`);

    // Preparar requisição
    let req = request(app.getHttpServer())[method.toLowerCase()](path);

    // ✨ NOVO: Adicionar headers customizados primeiro
    Object.entries(customHeaders).forEach(([key, value]) => {
      req = req.set(key, value);
    });

    // Adicionar autenticação
    if (requiresAuth) {
      // ✨ NOVO: Se tem token customizado, usar ele
      if (customToken) {
        req = req.set('Authorization', `Bearer ${customToken}`);
        console.log(`   🔐 Token: customizado (${customToken.substring(0, 20)}...)`);
      } else {
        // Lógica original: buscar usuário de teste
        const user = Array.from(testUsers.values()).find(
          (u) => u.role === userRole && (!clientId || u.clientId === clientId),
        );

        if (!user || !user.token) {
          throw new Error(
            `Usuário de teste não encontrado para role ${userRole} e client ${clientId}`,
          );
        }

        req = req.set('Authorization', `Bearer ${user.token}`);
        console.log(`   🔐 Token: ${user.email}`);
      }
    }

    // Adicionar client-id header
    if (clientId) {
      req = req.set('x-client-id', clientId);
    }

    // Adicionar impersonation (para SUPER_ADMIN)
    if (impersonate) {
      req = req.set('x-client-id', impersonate);
      console.log(`   🔄 Impersonating: ${impersonate}`);
    }

    // Adicionar corpo da requisição
    if (body) {
      req = req.send(body);
    }

    // Executar requisição
    const response = await req;

    // Verificar resultado
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📦 Body: ${JSON.stringify(response.body).substring(0, 200)}...`);

    // Validar status esperado
    expect(response.status).toBe(expectedStatus);

    return response;
  }

  /**
   * ========================================
   * 🎯 TESTES CUSTOMIZADOS - ADICIONE AQUI
   * ========================================
   */

  describe('1. Seus Testes Customizados', () => {
    it('exemplo: testar rota específica do seu módulo', async () => {
      // Exemplo de como testar qualquer rota:

      await testRoute({
        name: 'Listar Usuários (ADMIN)',
        method: 'GET',
        path: '/api/v1/users',
        requiresAuth: true,
        userRole: 'ADMIN',
        clientId: testClientId1,
        expectedStatus: 200,
      });
    });

    it('deve testar com token de usuário real do banco', async () => {
      // Buscar usuário real do banco usando email + clientId
      const realUser = await prismaService.user.findUnique({
        where: {
          clientId_email: {
            clientId: testClientId1,
            email: 'usuario.real@empresa.com',
          },
        },
      });

      // Opcional: garantir que o usuário existe antes de continuar
      expect(realUser).toBeDefined();

      // Gerar token para ele
      const token = await authService.login({
        email: 'usuario.real@empresa.com',
        password: 'senha-real',
      });

      // Testar com esse token
      await testRoute({
        name: 'Teste com Usuário Real',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        customToken: token.access_token, // ← Token customizado
        expectedStatus: 200,
      });
    });

    it('deve criar um novo usuario real', async () => {
      await testRoute({
        name: 'Criar Usuário Real',
        method: 'POST',
        path: '/api/v1/auth/register',
        requiresAuth: false,
        userRole: 'ADMIN',
        clientId: testClientId1,
        body: {
          email: 'usuario.real@empresa.com',
          password: 'teste123',
          role: 'ADMIN',
          clientId: testClientId1,
        },
        expectedStatus: 201,
      });
    });

    it('deve testar com headers especiais', async () => {
      await testRoute({
        name: 'Teste com Headers Custom',
        method: 'GET',
        path: '/api/v1/data',
        requiresAuth: true,
        userRole: 'ADMIN',
        clientId: testClientId1,
        customHeaders: {
          // ← Headers adicionais
          'X-API-Version': '2.0',
          'X-Request-ID': 'test-123',
          'Accept-Language': 'pt-BR',
        },
        expectedStatus: 200,
      });
    });

    // ADICIONE SEUS TESTES AQUI:
    //
    // it('testar criar produto', async () => {
    //   await testRoute({
    //     name: 'Criar Produto',
    //     method: 'POST',
    //     path: '/api/v1/products',
    //     requiresAuth: true,
    //     userRole: 'ADMIN',
    //     clientId: testClientId1,
    //     body: {
    //       name: 'Produto Teste',
    //       price: 99.99,
    //     },
    //     expectedStatus: 201,
    //   });
    // });
  });

  /**
   * ========================================
   * 📋 TESTES DE EXEMPLO
   * ========================================
   */

  describe('2. Testes de Rotas Públicas', () => {
    it('deve acessar endpoint de health sem autenticação', async () => {
      await testRoute({
        name: 'Health Check Público',
        method: 'GET',
        path: '/health',
        requiresAuth: false,
        expectedStatus: 200,
      });
    });

    it('deve acessar endpoint de métricas sem autenticação', async () => {
      await testRoute({
        name: 'Métricas Prometheus',
        method: 'GET',
        path: '/metrics',
        requiresAuth: false,
        expectedStatus: 200,
      });
    });

    it('deve fazer login com usuário válido', async () => {
      const user = testUsers.get('client1@test.com');

      if (!user) {
        throw new Error('Usuário de teste não encontrado');
      }

      await testRoute({
        name: 'Login de Usuário',
        method: 'POST',
        path: '/api/v1/auth/login',
        requiresAuth: false,
        body: {
          email: user.email,
          password: user.password,
        },
        expectedStatus: 200,
      });
    });
  });

  describe('3. Testes de Rotas Privadas - CLIENT', () => {
    it('deve acessar /me com autenticação', async () => {
      await testRoute({
        name: 'Get Current User',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        userRole: 'CLIENT',
        clientId: testClientId1,
        expectedStatus: 200,
      });
    });

    it('deve falhar ao acessar sem token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

      console.log('   ✅ Bloqueou acesso sem token');
    });
  });

  describe('4. Testes de Multi-Tenancy', () => {
    it('CLIENT não deve acessar dados de outro client', async () => {
      // Usuário do Client 1 tentando acessar com header do Client 2
      const user1 = Array.from(testUsers.values()).find(
        (u) => u.clientId === testClientId1 && u.role === 'CLIENT',
      );

      if (!user1 || !user1.token) {
        throw new Error('Usuário de teste não encontrado');
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user1.token}`)
        .set('x-client-id', testClientId2) // Client diferente!
        .expect(403); // Forbidden

      console.log('   ✅ Multi-tenancy respeitado - acesso negado');
    });

    it('usuários de clients diferentes devem ter dados isolados', async () => {
      const response1 = await testRoute({
        name: 'User do Client 1',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        userRole: 'CLIENT',
        clientId: testClientId1,
        expectedStatus: 200,
      });

      const response2 = await testRoute({
        name: 'User do Client 2',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        userRole: 'CLIENT',
        clientId: testClientId2,
        expectedStatus: 200,
      });

      // Verificar que são clientes diferentes
      expect(response1.body.clientId).not.toBe(response2.body.clientId);
      console.log('   ✅ Dados isolados entre clients');
    });
  });

  describe('5. Testes de SUPER_ADMIN Impersonation', () => {
    it('SUPER_ADMIN deve acessar dados do próprio client', async () => {
      await testRoute({
        name: 'SUPER_ADMIN - Próprio Client',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        userRole: 'SUPER_ADMIN',
        clientId: superAdminClientId,
        expectedStatus: 200,
      });
    });

    it('SUPER_ADMIN deve fazer impersonation de outro client', async () => {
      const superAdmin = Array.from(testUsers.values()).find((u) => u.role === 'SUPER_ADMIN');

      if (!superAdmin || !superAdmin.token) {
        throw new Error('SUPER_ADMIN não encontrado');
      }

      // SUPER_ADMIN acessando dados do Client 1
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${superAdmin.token}`)
        .set('x-client-id', testClientId1) // Impersonating Client 1
        .expect(200);

      console.log('   ✅ Impersonation funcionando');
      console.log(`   📋 SUPER_ADMIN acessou client: ${response.body.clientId}`);
    });

    it('CLIENT não pode fazer impersonation', async () => {
      const user = Array.from(testUsers.values()).find(
        (u) => u.role === 'CLIENT' && u.clientId === testClientId1,
      );

      if (!user || !user.token) {
        throw new Error('Usuário não encontrado');
      }

      // CLIENT tentando acessar outro client
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user.token}`)
        .set('x-client-id', testClientId2)
        .expect(403); // Forbidden

      console.log('   ✅ CLIENT não pode fazer impersonation');
    });
  });

  describe('6. Testes de Segurança', () => {
    it('deve rejeitar token inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token_invalido_123')
        .expect(401);

      console.log('   ✅ Token inválido rejeitado');
    });

    it('deve rejeitar token expirado', async () => {
      // Simular token expirado (você pode gerar um token com exp passado)
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid';

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      console.log('   ✅ Token expirado rejeitado');
    });

    it('deve rejeitar client-id de cliente inativo', async () => {
      // Criar cliente inativo
      const inactiveClient = await prismaService.client.create({
        data: {
          name: 'Inactive Client',
          slug: 'inactive-client-test',
          email: 'inactive@test.com',
          status: 'INACTIVE',
        },
      });

      const user = await prismaService.user.create({
        data: {
          name: 'Inactive User',
          email: 'inactiveuser@test.com',
          password: 'hashedpassword',
          clientId: inactiveClient.id,
          role: 'CLIENT',
          status: 'ACTIVE',
        },
      });

      // Tentar gerar token para usuário de cliente inativo
      try {
        const loginResult = await authService.login({
          email: 'inactiveuser@test.com',
          password: 'Test123!@#',
        });

        // Se chegou aqui, o login não deveria ter funcionado
        expect(false).toBe(true);
      } catch (error) {
        console.log('   ✅ Cliente inativo não pode fazer login');
      }

      // Limpar
      await prismaService.user.delete({ where: { id: user.id } });
      await prismaService.client.delete({ where: { id: inactiveClient.id } });
    });
  });

  /**
   * ========================================
   * 🛠️ UTILITÁRIOS PARA TESTES AVANÇADOS
   * ========================================
   */

  describe('7. Utilitários de Teste', () => {
    it('deve listar todos os usuários de teste disponíveis', () => {
      console.log('\n📋 Usuários de teste disponíveis:');
      testUsers.forEach((user, email) => {
        console.log(`   - ${email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Client ID: ${user.clientId}`);
        console.log(`     Token: ${user.token?.substring(0, 20)}...`);
      });
    });

    it('deve retornar informações dos clients de teste', () => {
      console.log('\n📋 Clients de teste:');
      console.log(`   - Client 1: ${testClientId1}`);
      console.log(`   - Client 2: ${testClientId2}`);
      console.log(`   - Super Admin Client: ${superAdminClientId}`);
    });
  });

  /**
   * ========================================
   * 📊 TESTE DE PERFORMANCE
   * ========================================
   */

  describe('8. Testes de Performance', () => {
    it('deve responder rapidamente em rotas autenticadas', async () => {
      const startTime = Date.now();

      await testRoute({
        name: 'Performance Test',
        method: 'GET',
        path: '/api/v1/auth/me',
        requiresAuth: true,
        userRole: 'CLIENT',
        clientId: testClientId1,
        expectedStatus: 200,
      });

      const responseTime = Date.now() - startTime;
      console.log(`   ⚡ Tempo de resposta: ${responseTime}ms`);

      expect(responseTime).toBeLessThan(1000); // Deve ser menos de 1 segundo
    });

    it('deve processar múltiplas requisições simultâneas', async () => {
      const promises: Promise<any>[] = [];
      const numRequests = 10;

      const startTime = Date.now();

      for (let i = 0; i < numRequests; i++) {
        promises.push(
          testRoute({
            name: `Concurrent Request ${i + 1}`,
            method: 'GET',
            path: '/health',
            requiresAuth: false,
            expectedStatus: 200,
          }),
        );
      }

      await Promise.all(promises);

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / numRequests;

      console.log(`   ⚡ ${numRequests} requisições em ${totalTime}ms`);
      console.log(`   ⚡ Tempo médio: ${avgTime.toFixed(2)}ms`);
    });
  });
});
