import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do BemMeCare...');

  // 1. Criar cliente BemMeCare
  console.log('📊 Criando cliente BemMeCare...');
  const client = await prisma.client.upsert({
    where: { slug: 'bemmecare' },
    update: {},
    create: {
      name: 'BemMeCare',
      slug: 'bemmecare',
      email: 'contato@bemmecare.com',
      phone: '(11) 99999-9999',
      status: 'ACTIVE',
      plan: 'premium',
    },
  });

  // 2. Criar usuários
  console.log('👥 Criando usuários...');

  const adminUser = await prisma.user.upsert({
    where: { clientId_email: { clientId: client.id, email: 'admin@bemmecare.com' } },
    update: {},
    create: {
      clientId: client.id,
      name: 'Administrador BemMeCare',
      email: 'admin@bemmecare.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  // 3. Criar categorias
  console.log('📂 Criando categorias...');
  const categoriaBarras = await prisma.category.create({
    data: {
      clientId: client.id,
      name: 'Barras',
      description: 'Exercícios com barras',
      type: 'service',
    },
  });

  const categoriaBastao = await prisma.category.create({
    data: {
      clientId: client.id,
      name: 'Bastão',
      description: 'Exercícios com bastão',
      type: 'service',
    },
  });

  // 4. Criar serviços
  console.log('💪 Criando serviços...');
  await prisma.service.create({
    data: {
      clientId: client.id,
      name: 'Treino Barras Individual',
      description: 'Treino individual com barras personalizadas',
      duration: 60,
      price: 80.0,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      clientId: client.id,
      name: 'Treino Bastão',
      description: 'Treino com bastão para fortalecimento',
      duration: 45,
      price: 100.0,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      clientId: client.id,
      name: 'Consulta Avaliação',
      description: 'Avaliação física e consulta nutricional',
      duration: 90,
      price: 120.0,
      isActive: true,
    },
  });

  console.log('✅ Seed do BemMeCare concluído com sucesso!');
  console.log(`📊 Cliente criado: ${client.name} (${client.slug})`);
  console.log(`👥 Usuário: admin@bemmecare.com (senha: password)`);
  console.log(`💪 3 serviços criados`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
