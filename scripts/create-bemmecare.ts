import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createBemMeCare() {
  console.log('🏥 Criando BemMeCare no sistema...\n');

  try {
    // Verificar se já existe
    const existingClient = await prisma.client.findUnique({
      where: { id: 'clnt_bemmecare' },
    });

    if (existingClient) {
      console.log('⚠️  BemMeCare já existe no sistema!');
      console.log('🔍 Verificando usuário admin...\n');
    } else {
      // Criar cliente BemMeCare
      const bemMeCareClient = await prisma.client.create({
        data: {
          id: 'clnt_bemmecare',
          name: 'BemMeCare',
          slug: 'bemmecare',
          email: 'contato@bemmecare.com',
          phone: '(11) 3333-4444',
          website: 'https://bemmecare.com',
          status: 'ACTIVE',
          plan: 'premium',
          settings: JSON.stringify({
            type: 'clinica',
            theme: 'blue',
            features: ['appointments', 'patients', 'doctors', 'products', 'sales'],
            specialties: ['Cardiologia', 'Dermatologia', 'Pediatria', 'Ortopedia'],
            workingHours: {
              monday: '07:00-19:00',
              tuesday: '07:00-19:00',
              wednesday: '07:00-19:00',
              thursday: '07:00-19:00',
              friday: '07:00-19:00',
              saturday: '08:00-14:00',
              sunday: 'closed',
            },
          }),
        },
      });

      console.log('✅ Cliente BemMeCare criado com sucesso!');
      console.log(`   🆔 ID: ${bemMeCareClient.id}`);
      console.log(`   📧 Email: ${bemMeCareClient.email}`);
      console.log(`   🌐 Website: ${bemMeCareClient.website}\n`);
    }

    // Verificar se usuário admin já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        clientId_email: {
          clientId: 'clnt_bemmecare',
          email: 'admin@bemmecare.com',
        },
      },
    });

    if (existingUser) {
      console.log('⚠️  Usuário admin@bemmecare.com já existe!');
      console.log('🔄 Atualizando senha para admin123...\n');

      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.update({
        where: {
          clientId_email: {
            clientId: 'clnt_bemmecare',
            email: 'admin@bemmecare.com',
          },
        },
        data: { password: hashedPassword },
      });

      console.log('✅ Senha atualizada com sucesso!');
    } else {
      // Criar usuário admin
      const hashedPassword = await bcrypt.hash('admin123', 12);

      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin BemMeCare',
          email: 'admin@bemmecare.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          clientId: 'clnt_bemmecare',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      console.log('✅ Usuário admin criado com sucesso!');
      console.log(`   👤 Nome: ${adminUser.name}`);
      console.log(`   📧 Email: ${adminUser.email}`);
      console.log(`   🔑 Senha: admin123`);
      console.log(`   👑 Papel: ${adminUser.role}\n`);
    }

    // Criar alguns dados de exemplo para BemMeCare
    console.log('📊 Criando dados de exemplo...');

    // Verificar se já existem funcionários
    const existingEmployees = await prisma.employee.findMany({
      where: { clientId: 'clnt_bemmecare' },
    });

    if (existingEmployees.length === 0) {
      // Criar funcionários
      const funcionarios = [
        {
          name: 'Dr. João Santos',
          email: 'joao.santos@bemmecare.com',
          position: 'Cardiologista',
          phone: '(11) 99999-1001',
        },
        {
          name: 'Dra. Ana Lima',
          email: 'ana.lima@bemmecare.com',
          position: 'Dermatologista',
          phone: '(11) 99999-1002',
        },
        {
          name: 'Dr. Carlos Santos',
          email: 'carlos.santos@bemmecare.com',
          position: 'Pediatra',
          phone: '(11) 99999-1003',
        },
        {
          name: 'Dra. Fernanda Costa',
          email: 'fernanda.costa@bemmecare.com',
          position: 'Ortopedista',
          phone: '(11) 99999-1004',
        },
      ];

      for (const func of funcionarios) {
        await prisma.employee.create({
          data: {
            clientId: 'clnt_bemmecare',
            ...func,
            workingHours: {
              monday: '07:00-19:00',
              tuesday: '07:00-19:00',
              wednesday: '07:00-19:00',
              thursday: '07:00-19:00',
              friday: '07:00-19:00',
              saturday: '08:00-14:00',
            },
          },
        });
      }

      console.log('✅ Funcionários criados!');
    }

    console.log('\n🎉 BEMMECARE CONFIGURADO COM SUCESSO!');
    console.log('='.repeat(50));
    console.log('🔐 CREDENCIAIS DE ACESSO:');
    console.log('   📧 Email: admin@bemmecare.com');
    console.log('   🔑 Senha: admin123');
    console.log('   🆔 Client ID: clnt_bemmecare');
    console.log('   🌐 Frontend: http://localhost:3001');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Erro ao criar BemMeCare:', error);
  }
}

createBemMeCare()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
