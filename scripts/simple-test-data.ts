import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Criando dados de teste simples...');

  // 1. Criar empresa de AutoPeças
  const autoPartsClient = await prisma.client.upsert({
    where: { slug: 'autopecas' },
    update: {},
    create: {
      name: 'AutoPeças Express',
      slug: 'autopecas',
      email: 'contato@autopecas.com',
      status: 'ACTIVE',
      plan: 'professional',
    },
  });

  // 2. Criar empresa Clínica
  const clinicClient = await prisma.client.upsert({
    where: { slug: 'clinica' },
    update: {},
    create: {
      name: 'Clínica VitalSaúde',
      slug: 'clinica',
      email: 'contato@vitalsaude.com',
      status: 'ACTIVE',
      plan: 'professional',
    },
  });

  // 3. Criar empresa Imobiliária
  const realEstateClient = await prisma.client.upsert({
    where: { slug: 'imobiliaria' },
    update: {},
    create: {
      name: 'Imobiliária PrimeCasas',
      slug: 'imobiliaria',
      email: 'contato@primecasas.com',
      status: 'ACTIVE',
      plan: 'professional',
    },
  });

  // 4. Criar usuários admin para cada empresa
  const password = await bcrypt.hash('Admin123!', 12);

  // Admin AutoPeças
  const autoAdmin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: autoPartsClient.id,
        email: 'admin@autopecas.com',
      },
    },
    update: {},
    create: {
      name: 'Admin AutoPeças',
      email: 'admin@autopecas.com',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: autoPartsClient.id,
      emailVerified: true,
    },
  });

  // Admin Clínica
  const clinicAdmin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: clinicClient.id,
        email: 'admin@vitalsaude.com',
      },
    },
    update: {},
    create: {
      name: 'Admin Clínica',
      email: 'admin@vitalsaude.com',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: clinicClient.id,
      emailVerified: true,
    },
  });

  // Admin Imobiliária
  const realEstateAdmin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: realEstateClient.id,
        email: 'admin@primecasas.com',
      },
    },
    update: {},
    create: {
      name: 'Admin Imobiliária',
      email: 'admin@primecasas.com',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: realEstateClient.id,
      emailVerified: true,
    },
  });

  // 5. Criar alguns produtos para AutoPeças
  for (let i = 1; i <= 10; i++) {
    await prisma.product.create({
      data: {
        name: `Produto AutoPeças ${i}`,
        description: `Descrição do produto ${i}`,
        price: Math.random() * 100 + 10,
        sku: `AUTO${i.toString().padStart(3, '0')}`,
        stock: Math.floor(Math.random() * 50) + 5,
        clientId: autoPartsClient.id,
      },
    });
  }

  // 6. Criar algumas propriedades para Imobiliária
  for (let i = 1; i <= 5; i++) {
    await (prisma as any).property.create({
      data: {
        title: `Casa ${i} - Vila Madalena`,
        description: `Excelente casa com ${2 + i} quartos`,
        type: 'HOUSE',
        status: 'AVAILABLE',
        address: `Rua Teste, ${100 + i}`,
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05412-000',
        bedrooms: 2 + i,
        bathrooms: 1 + i,
        area: 100 + i * 20,
        price: 500000 + i * 100000,
        clientId: realEstateClient.id,
      },
    });
  }

  // 7. Criar alguns funcionários para Clínica
  for (let i = 1; i <= 3; i++) {
    await prisma.employee.create({
      data: {
        name: `Dr. Médico ${i}`,
        email: `medico${i}@vitalsaude.com`,
        position: 'Médico',
        clientId: clinicClient.id,
      },
    });
  }

  console.log('✅ DADOS DE TESTE CRIADOS COM SUCESSO!');
  console.log(`
📊 RESUMO:
- 3 Empresas criadas
- 3 Admins criados
- 10 Produtos (AutoPeças)
- 5 Propriedades (Imobiliária)
- 3 Funcionários (Clínica)

🔑 CREDENCIAIS DE TESTE:
- admin@autopecas.com / Admin123!
- admin@vitalsaude.com / Admin123!
- admin@primecasas.com / Admin123!
  `);
}

createTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
