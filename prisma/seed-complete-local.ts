import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// IDs fixos para os clientes (mesmos do seed-comprehensive)
const BEMMECARE_CLIENT_ID = '4a2d7176-3f9d-43da-9a7f-e97d08f54744';
const EXPATRIAMENTE_CLIENT_ID = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

async function main() {
  console.log('🚀 Iniciando seed completo para ambiente local...\n');

  // 1. Criar Cliente BemMeCare
  console.log('🏢 Criando cliente BemMeCare...');
  const bemmecareClient = await prisma.client.upsert({
    where: { id: BEMMECARE_CLIENT_ID },
    update: {
      name: 'BemMeCare',
      slug: 'bemmecare',
      email: 'contato@bemmecare.com.br',
      website: 'https://bemmecare.com.br',
      status: 'ACTIVE',
      activeServices: ['ECOMMERCE', 'SCHEDULE', 'FINANCE', 'ANALYTICS'],
    },
    create: {
      id: BEMMECARE_CLIENT_ID,
      name: 'BemMeCare',
      slug: 'bemmecare',
      email: 'contato@bemmecare.com.br',
      website: 'https://bemmecare.com.br',
      status: 'ACTIVE',
      activeServices: ['ECOMMERCE', 'SCHEDULE', 'FINANCE', 'ANALYTICS'],
    },
  });
  console.log(`✅ Cliente BemMeCare criado: ${bemmecareClient.id}\n`);

  // 2. Criar Cliente Expatriamente
  console.log('🏢 Criando cliente Expatriamente...');
  const expatriamenteClient = await prisma.client.upsert({
    where: { id: EXPATRIAMENTE_CLIENT_ID },
    update: {
      name: 'Expatriamente',
      slug: 'expatriamente',
      email: 'contato@expatriamente.com.br',
      website: 'https://expatriamente.com.br',
      status: 'ACTIVE',
      activeServices: ['APPOINTMENTS', 'USERS', 'ANALYTICS'],
    },
    create: {
      id: EXPATRIAMENTE_CLIENT_ID,
      name: 'Expatriamente',
      slug: 'expatriamente',
      email: 'contato@expatriamente.com.br',
      website: 'https://expatriamente.com.br',
      status: 'ACTIVE',
      activeServices: ['APPOINTMENTS', 'USERS', 'ANALYTICS'],
    },
  });
  console.log(`✅ Cliente Expatriamente criado: ${expatriamenteClient.id}\n`);

  // 3. Criar usuários admin para cada cliente
  console.log('👤 Criando usuários admin...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const bemmecareAdmin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: BEMMECARE_CLIENT_ID,
        email: 'admin@bemmecare.com.br',
      },
    },
    update: {
      name: 'Admin BemMeCare',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      clientId: BEMMECARE_CLIENT_ID,
      name: 'Admin BemMeCare',
      email: 'admin@bemmecare.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin BemMeCare criado: ${bemmecareAdmin.email}`);

  const expatriamenteAdmin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: EXPATRIAMENTE_CLIENT_ID,
        email: 'admin@expatriamente.com.br',
      },
    },
    update: {
      name: 'Admin Expatriamente',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      clientId: EXPATRIAMENTE_CLIENT_ID,
      name: 'Admin Expatriamente',
      email: 'admin@expatriamente.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Admin Expatriamente criado: ${expatriamenteAdmin.email}\n`);

  console.log('🎉 Seed inicial completo!');
  console.log('\n📝 CREDENCIAIS DE ACESSO:');
  console.log('================================');
  console.log('BemMeCare:');
  console.log('  Email: admin@bemmecare.com.br');
  console.log('  Senha: admin123');
  console.log('');
  console.log('Expatriamente:');
  console.log('  Email: admin@expatriamente.com.br');
  console.log('  Senha: admin123');
  console.log('================================\n');

  console.log('✅ Agora você pode rodar o seed-comprehensive com:');
  console.log('   npm run seed:comprehensive\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
