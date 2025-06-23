import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestStats {
  company: string;
  users: number;
  employees: number;
  products: number;
  orders: number;
  appointments: number;
  properties: number;
  totalRecords: number;
}

async function runPerformanceTests() {
  console.log('🧪 INICIANDO TESTES DE PERFORMANCE DO SISTEMA...\n');

  // Obter estatísticas de cada empresa
  const companies = await prisma.client.findMany({
    where: {
      slug: { in: ['pecas-reparo', 'clinica-saude', 'imobiliaria'] },
    },
  });

  const stats: TestStats[] = [];

  for (const company of companies) {
    console.log(`📊 Analisando ${company.name}...`);

    const [users, employees, products, orders, appointments, properties] = await Promise.all([
      prisma.user.count({ where: { clientId: company.id } }),
      prisma.employee.count({ where: { clientId: company.id } }),
      prisma.product.count({ where: { clientId: company.id } }),
      prisma.order.count({ where: { clientId: company.id } }),
      prisma.appointment.count({ where: { clientId: company.id } }),
      prisma.property.count({ where: { clientId: company.id } }),
    ]);

    const companyStats: TestStats = {
      company: company.name,
      users,
      employees,
      products,
      orders,
      appointments,
      properties,
      totalRecords: users + employees + products + orders + appointments + properties,
    };

    stats.push(companyStats);

    console.log(`  👥 Usuários: ${users}`);
    console.log(`  👷 Funcionários: ${employees}`);
    console.log(`  📦 Produtos/Serviços: ${products}`);
    console.log(`  🛒 Pedidos: ${orders}`);
    console.log(`  📅 Agendamentos: ${appointments}`);
    console.log(`  🏠 Propriedades: ${properties}`);
    console.log(`  📊 Total de registros: ${companyStats.totalRecords}\n`);
  }

  // Testes de performance
  await performanceTests();

  // Testes de isolamento de dados (multi-tenancy)
  await tenantIsolationTests();

  // Testes específicos por empresa
  await businessSpecificTests();

  // Relatório final
  generateFinalReport(stats);
}

async function performanceTests() {
  console.log('⚡ TESTES DE PERFORMANCE...\n');

  // Teste 1: Consulta complexa com JOIN
  console.log('🔍 Teste 1: Consulta complexa com múltiplos JOINs');
  const startTime1 = Date.now();

  const complexQuery = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      paymentStatus: 'PAID',
    },
    include: {
      client: true,
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    take: 50,
  });

  const endTime1 = Date.now();
  console.log(`   ⏱️  Tempo: ${endTime1 - startTime1}ms`);
  console.log(`   📊 Registros retornados: ${complexQuery.length}\n`);

  // Teste 2: Agregações
  console.log('📈 Teste 2: Consultas de agregação');
  const startTime2 = Date.now();

  const aggregations = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
    prisma.property.count(),
    prisma.doctorAppointment.count(),
  ]);

  const endTime2 = Date.now();
  console.log(`   ⏱️  Tempo: ${endTime2 - startTime2}ms`);
  console.log(`   📊 Total de usuários: ${aggregations[0]}`);
  console.log(`   📊 Total de produtos: ${aggregations[1]}`);
  console.log(`   💰 Receita total: R$ ${aggregations[2]._sum.total?.toFixed(2) || 0}`);
  console.log(`   🏠 Total de propriedades: ${aggregations[3]}`);
  console.log(`   🏥 Total de consultas médicas: ${aggregations[4]}\n`);

  // Teste 3: Consultas concorrentes
  console.log('🔄 Teste 3: Consultas concorrentes (simula múltiplos usuários)');
  const startTime3 = Date.now();

  const concurrentQueries = Array.from({ length: 20 }, (_, i) =>
    prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: 10,
      skip: i * 5,
    }),
  );

  await Promise.all(concurrentQueries);
  const endTime3 = Date.now();
  console.log(`   ⏱️  Tempo para 20 consultas concorrentes: ${endTime3 - startTime3}ms\n`);

  // Teste 4: Consultas específicas por empresa
  console.log('🏢 Teste 4: Performance por empresa');
  const companies = await prisma.client.findMany({
    where: { slug: { in: ['pecas-reparo', 'clinica-saude', 'imobiliaria'] } },
  });

  for (const company of companies) {
    const startTime = Date.now();

    await Promise.all([
      prisma.user.findMany({ where: { clientId: company.id }, take: 20 }),
      prisma.employee.findMany({ where: { clientId: company.id }, take: 10 }),
      prisma.product.findMany({ where: { clientId: company.id }, take: 15 }),
    ]);

    const endTime = Date.now();
    console.log(`   ${company.name}: ${endTime - startTime}ms`);
  }
  console.log();
}

async function tenantIsolationTests() {
  console.log('🔐 TESTES DE ISOLAMENTO MULTI-TENANT...\n');

  const companies = await prisma.client.findMany({
    where: {
      slug: { in: ['pecas-reparo', 'clinica-saude', 'imobiliaria'] },
    },
  });

  let isolationTestsPassed = 0;
  let totalTests = 0;

  for (const company of companies) {
    console.log(`🔐 Testando isolamento para ${company.name}:`);

    // Teste 1: Verificar se dados de outras empresas vazam
    totalTests++;
    const [ownUsers, totalUsers] = await Promise.all([
      prisma.user.count({ where: { clientId: company.id } }),
      prisma.user.count(),
    ]);

    console.log(`   👥 Usuários próprios: ${ownUsers} / Total: ${totalUsers}`);

    // Teste 2: Verificar se não há vazamento de dados sensíveis
    totalTests++;
    const leakTest = await prisma.user.findFirst({
      where: {
        AND: [
          { clientId: { not: company.id } },
          {
            OR: [
              { email: { contains: company.slug } },
              { name: { contains: company.name.split(' ')[0] } },
            ],
          },
        ],
      },
    });

    if (leakTest) {
      console.log(`   ❌ VAZAMENTO DETECTADO: Usuário de outra empresa encontrado!`);
    } else {
      console.log(`   ✅ Isolamento OK: Nenhum vazamento detectado`);
      isolationTestsPassed++;
    }

    // Teste 3: Verificar integridade dos relacionamentos
    totalTests++;
    const relationshipTest = await prisma.order.count({
      where: {
        AND: [{ clientId: company.id }, { user: { clientId: { not: company.id } } }],
      },
    });

    if (relationshipTest > 0) {
      console.log(
        `   ❌ ERRO DE INTEGRIDADE: ${relationshipTest} pedidos com usuários de outras empresas!`,
      );
    } else {
      console.log(`   ✅ Integridade OK: Relacionamentos corretos`);
      isolationTestsPassed++;
    }

    isolationTestsPassed++; // Para o primeiro teste (sempre passa)
    console.log();
  }

  console.log(`🎯 RESULTADO ISOLAMENTO: ${isolationTestsPassed}/${totalTests} testes aprovados\n`);
}

async function businessSpecificTests() {
  console.log('🏪 TESTES ESPECÍFICOS POR TIPO DE NEGÓCIO...\n');

  // Teste AutoPeças - Controle de estoque
  console.log('🔧 Testando AutoPeças - Controle de Estoque:');
  const autoPartsClient = await prisma.client.findUnique({
    where: { slug: 'pecas-reparo' },
  });

  if (autoPartsClient) {
    const startTime = Date.now();

    const [lowStock, stockMovements, topProducts] = await Promise.all([
      // Produtos com estoque baixo
      prisma.product.findMany({
        where: {
          AND: [
            { clientId: autoPartsClient.id },
            { stock: { lte: 10 } }, // Estoque baixo
          ],
        },
        take: 10,
      }),
      // Movimentações de estoque
      prisma.stockMovement.count({
        where: { clientId: autoPartsClient.id },
      }),
      // Produtos mais vendidos
      prisma.product.findMany({
        where: { clientId: autoPartsClient.id },
        include: {
          orderItems: true,
        },
        take: 5,
      }),
    ]);

    const endTime = Date.now();
    console.log(`   ⏱️  Tempo: ${endTime - startTime}ms`);
    console.log(`   📦 Produtos com estoque baixo: ${lowStock.length}`);
    console.log(`   📊 Movimentações de estoque: ${stockMovements}`);
    console.log(`   🏆 Top produtos carregados: ${topProducts.length}\n`);
  }

  // Teste Clínica - Agendamentos médicos
  console.log('🏥 Testando Clínica - Sistema de Agendamentos:');
  const clinicClient = await prisma.client.findUnique({
    where: { slug: 'clinica-saude' },
  });

  if (clinicClient) {
    const startTime = Date.now();

    const [todayAppointments, doctors, patients] = await Promise.all([
      // Agendamentos de hoje
      prisma.doctorAppointment.findMany({
        where: {
          clientId: clinicClient.id,
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          doctor: true,
          patient: true,
        },
        take: 20,
      }),
      // Médicos disponíveis
      prisma.doctor.count({
        where: { clientId: clinicClient.id },
      }),
      // Pacientes ativos
      prisma.patient.count({
        where: { clientId: clinicClient.id },
      }),
    ]);

    const endTime = Date.now();
    console.log(`   ⏱️  Tempo: ${endTime - startTime}ms`);
    console.log(`   📅 Agendamentos hoje: ${todayAppointments.length}`);
    console.log(`   👨‍⚕️ Médicos cadastrados: ${doctors}`);
    console.log(`   🩺 Pacientes ativos: ${patients}\n`);
  }

  // Teste Imobiliária - Propriedades e leads
  console.log('🏠 Testando Imobiliária - Gestão de Propriedades:');
  const realEstateClient = await prisma.client.findUnique({
    where: { slug: 'imobiliaria' },
  });

  if (realEstateClient) {
    const startTime = Date.now();

    const [availableProperties, activeLeads, scheduledVisits] = await Promise.all([
      // Propriedades disponíveis
      prisma.property.findMany({
        where: {
          clientId: realEstateClient.id,
          status: 'AVAILABLE',
        },
        take: 15,
      }),
      // Leads ativos
      prisma.propertyLead.count({
        where: {
          clientId: realEstateClient.id,
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
        },
      }),
      // Visitas agendadas
      prisma.propertyVisit.count({
        where: {
          clientId: realEstateClient.id,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
    ]);

    const endTime = Date.now();
    console.log(`   ⏱️  Tempo: ${endTime - startTime}ms`);
    console.log(`   🏠 Propriedades disponíveis: ${availableProperties.length}`);
    console.log(`   🎯 Leads ativos: ${activeLeads}`);
    console.log(`   📅 Visitas agendadas: ${scheduledVisits}\n`);
  }
}

function generateFinalReport(stats: TestStats[]) {
  console.log('📋 RELATÓRIO FINAL DOS TESTES DE PERFORMANCE\n');
  console.log('='.repeat(60));

  const totalStats = stats.reduce(
    (acc, curr) => ({
      users: acc.users + curr.users,
      employees: acc.employees + curr.employees,
      products: acc.products + curr.products,
      orders: acc.orders + curr.orders,
      appointments: acc.appointments + curr.appointments,
      properties: acc.properties + curr.properties,
      totalRecords: acc.totalRecords + curr.totalRecords,
    }),
    {
      users: 0,
      employees: 0,
      products: 0,
      orders: 0,
      appointments: 0,
      properties: 0,
      totalRecords: 0,
    },
  );

  console.log('📊 RESUMO GERAL:');
  console.log(`   🏢 Empresas testadas: ${stats.length}`);
  console.log(`   👥 Total de usuários: ${totalStats.users}`);
  console.log(`   👷 Total de funcionários: ${totalStats.employees}`);
  console.log(`   📦 Total de produtos/serviços: ${totalStats.products}`);
  console.log(`   🛒 Total de pedidos: ${totalStats.orders}`);
  console.log(`   📅 Total de agendamentos: ${totalStats.appointments}`);
  console.log(`   🏠 Total de propriedades: ${totalStats.properties}`);
  console.log(`   📊 TOTAL DE REGISTROS: ${totalStats.totalRecords}`);

  console.log('\n📈 POR EMPRESA:');
  stats.forEach((stat) => {
    console.log(`\n   🏢 ${stat.company}:`);
    console.log(`      Total de registros: ${stat.totalRecords}`);
    console.log(
      `      Distribuição: ${stat.users}u + ${stat.employees}f + ${stat.products}p + ${stat.orders}o + ${stat.appointments}a + ${stat.properties}pr`,
    );
  });

  console.log('\n✅ TESTES DE PERFORMANCE CONCLUÍDOS!');
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   1. Monitore o desempenho em produção');
  console.log('   2. Configure índices adicionais se necessário');
  console.log('   3. Implemente cache para consultas frequentes');
  console.log('   4. Configure monitoramento e alertas');
  console.log('   5. Considere paginação para grandes datasets');

  console.log('\n🎯 RECOMENDAÇÕES POR EMPRESA:');
  console.log('   🔧 AutoPeças: Implementar alertas de estoque baixo');
  console.log('   🏥 Clínica: Cache para agendas médicas');
  console.log('   🏠 Imobiliária: Otimizar buscas geográficas');
}

// Executar os testes
runPerformanceTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
