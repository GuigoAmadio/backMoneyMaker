import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('👥 Criando usuários de teste para cada empresa...\n');

  const companies = await prisma.client.findMany({
    where: {
      slug: { in: ['pecas-reparo', 'clinica-saude', 'imobiliaria'] },
    },
  });

  const testUsers = [
    {
      name: 'Teste Admin AutoPeças',
      email: 'teste.admin@autopecas.com',
      password: 'Teste123!',
      role: 'ADMIN' as const,
      company: 'pecas-reparo',
    },
    {
      name: 'Teste Funcionário AutoPeças',
      email: 'teste.funcionario@autopecas.com',
      password: 'Teste123!',
      role: 'EMPLOYEE' as const,
      company: 'pecas-reparo',
    },
    {
      name: 'Teste Cliente AutoPeças',
      email: 'teste.cliente@autopecas.com',
      password: 'Teste123!',
      role: 'CLIENT' as const,
      company: 'pecas-reparo',
    },
    {
      name: 'Teste Admin Clínica',
      email: 'teste.admin@vitalsaude.com',
      password: 'Teste123!',
      role: 'ADMIN' as const,
      company: 'clinica-saude',
    },
    {
      name: 'Teste Médico',
      email: 'teste.medico@vitalsaude.com',
      password: 'Teste123!',
      role: 'EMPLOYEE' as const,
      company: 'clinica-saude',
    },
    {
      name: 'Teste Paciente',
      email: 'teste.paciente@vitalsaude.com',
      password: 'Teste123!',
      role: 'CLIENT' as const,
      company: 'clinica-saude',
    },
    {
      name: 'Teste Admin Imobiliária',
      email: 'teste.admin@primecasas.com',
      password: 'Teste123!',
      role: 'ADMIN' as const,
      company: 'imobiliaria',
    },
    {
      name: 'Teste Corretor',
      email: 'teste.corretor@primecasas.com',
      password: 'Teste123!',
      role: 'EMPLOYEE' as const,
      company: 'imobiliaria',
    },
    {
      name: 'Teste Cliente Imobiliária',
      email: 'teste.cliente@primecasas.com',
      password: 'Teste123!',
      role: 'CLIENT' as const,
      company: 'imobiliaria',
    },
  ];

  for (const userData of testUsers) {
    const company = companies.find((c) => c.slug === userData.company);
    if (!company) continue;

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    try {
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          status: 'ACTIVE',
          clientId: company.id,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      console.log(`✅ ${userData.name} criado para ${company.name}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔑 Senha: ${userData.password}`);
      console.log(`   👤 Papel: ${userData.role}\n`);
    } catch (error) {
      console.log(`⚠️  ${userData.name} já existe ou erro: ${error}\n`);
    }
  }

  console.log('🎯 USUÁRIOS DE TESTE CRIADOS!');
  console.log('📋 CREDENCIAIS PARA TESTES:');
  console.log('='.repeat(50));
  testUsers.forEach((user) => {
    console.log(`${user.name}: ${user.email} / ${user.password}`);
  });
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
