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

  console.log('✅ DADOS BÁSICOS CRIADOS!');
  console.log('admin@autopecas.com / Admin123!');
}

createTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
