/**
 * 🚀 QUICK ROUTE TEST
 *
 * Script rápido para testar rotas específicas sem precisar rodar o Jest.
 * Útil para testes ad-hoc e debug rápido.
 *
 * USO:
 * ts-node src/test/quick-route-test.ts
 */

import axios, { Method } from 'axios';

// Configuração
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const DEFAULT_CLIENT_ID = 'seu-client-id-aqui';

interface QuickTestConfig {
  name: string;
  method: Method;
  path: string;
  token?: string;
  clientId?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Função principal para testar rotas rapidamente
 */
async function quickTest(config: QuickTestConfig) {
  const { name, method, path, token, clientId, body, headers = {} } = config;

  console.log(`\n🧪 Testando: ${name}`);
  console.log(`📍 ${method} ${BASE_URL}${path}`);

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
      console.log(`🔐 Com autenticação`);
    }

    if (clientId) {
      requestHeaders['x-client-id'] = clientId;
      console.log(`🏢 Client ID: ${clientId}`);
    }

    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
      data: body,
      headers: requestHeaders,
      timeout: 10000,
      validateStatus: () => true, // Aceitar qualquer status
    });

    console.log(`\n✅ Status: ${response.status} ${response.statusText}`);
    console.log(`📦 Response:`);
    console.log(JSON.stringify(response.data, null, 2));

    return response;
  } catch (error: any) {
    console.error(`\n❌ Erro na requisição:`);
    console.error(error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

/**
 * Função para fazer login e obter token
 */
async function login(email: string, password: string): Promise<string> {
  console.log(`\n🔐 Fazendo login com ${email}...`);

  const response = await quickTest({
    name: 'Login',
    method: 'POST',
    path: '/api/v1/auth/login',
    body: { email, password },
  });

  if (response.data.access_token) {
    console.log(`✅ Token obtido com sucesso!`);
    return response.data.access_token;
  }

  throw new Error('Falha ao obter token');
}

/**
 * ========================================
 * 🎯 SEUS TESTES AQUI
 * ========================================
 */
async function runTests() {
  console.log('🚀 Iniciando testes rápidos...\n');
  console.log('='.repeat(50));

  try {
    // ==========================================
    // TESTE 1: Health Check (Rota Pública)
    // ==========================================
    await quickTest({
      name: 'Health Check',
      method: 'GET',
      path: '/health',
    });

    // ==========================================
    // TESTE 2: Métricas (Rota Pública)
    // ==========================================
    await quickTest({
      name: 'Métricas Prometheus',
      method: 'GET',
      path: '/metrics',
    });

    // ==========================================
    // TESTE 3: Login e Get User Info
    // ==========================================

    // Substitua pelos seus dados de teste:
    const email = 'seu-email@test.com';
    const password = 'sua-senha';

    // Fazer login
    const token = await login(email, password);

    // Testar rota autenticada
    await quickTest({
      name: 'Get Current User',
      method: 'GET',
      path: '/api/v1/auth/me',
      token,
    });

    // ==========================================
    // TESTE 4: Testar com Client ID específico
    // ==========================================
    await quickTest({
      name: 'Get User with Client ID',
      method: 'GET',
      path: '/api/v1/auth/me',
      token,
      clientId: DEFAULT_CLIENT_ID,
    });

    // ==========================================
    // TESTE 5: Criar algo (exemplo)
    // ==========================================
    // await quickTest({
    //   name: 'Criar Produto',
    //   method: 'POST',
    //   path: '/api/v1/products',
    //   token,
    //   body: {
    //     name: 'Produto Teste',
    //     price: 99.99,
    //     description: 'Descrição do produto',
    //   },
    // });

    // ==========================================
    // TESTE 6: Listar dados
    // ==========================================
    // await quickTest({
    //   name: 'Listar Usuários',
    //   method: 'GET',
    //   path: '/api/v1/users',
    //   token,
    // });

    console.log('\n' + '='.repeat(50));
    console.log('✅ Todos os testes concluídos com sucesso!');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Erro durante os testes');
    process.exit(1);
  }
}

// Executar testes
runTests();
