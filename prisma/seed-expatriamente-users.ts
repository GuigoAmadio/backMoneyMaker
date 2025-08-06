import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Ler o arquivo JSON
const psicanalistasPath = path.join(__dirname, 'psicanalistas.json');
const psicanalistasData = fs.readFileSync(psicanalistasPath, 'utf8');
const psicanalistas = JSON.parse(psicanalistasData);

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando todos os dados relacionados...');

  // Deletar registros relacionados primeiro (em ordem reversa das dependências)
  await prisma.appointment.deleteMany({});
  console.log('✅ Appointments deletados');

  await prisma.order.deleteMany({});
  console.log('✅ Orders deletados');

  await prisma.product.deleteMany({});
  console.log('✅ Products deletados');

  await prisma.service.deleteMany({});
  console.log('✅ Services deletados');

  await prisma.employee.deleteMany({});
  console.log('✅ Employees deletados');

  await prisma.client.deleteMany({});
  console.log('✅ Clients deletados');

  // Agora deletar todos os usuários
  await prisma.user.deleteMany({});
  console.log('✅ Todos os usuários deletados');

  // Client ID do Expatriamente
  const clientId = 'a9a86733-b2a5-4f0e-b230-caed27ce74df';

  console.log('🏢 Criando client Expatriamente...');

  // Criar o client primeiro
  const client = await prisma.client.create({
    data: {
      id: clientId,
      name: 'Expatriamente',
      email: 'contato@expatriamente.com',
      slug: 'expatriamente',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Client criado:', client.name);

  console.log('👤 Criando admin...');

  // Criar admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Expatriamente',
      email: 'admin@expatriamente.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      clientId: clientId,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin criado:', admin.email);

  console.log('👥 Criando funcionários...');

  // Criar funcionários baseado no arquivo psicanalistas.json
  const funcionarios = psicanalistas.filter((p) => p.convite === 'Sim');

  for (const psicanalista of funcionarios) {
    // Gerar email baseado no nome
    const nomeNormalizado = psicanalista.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '.') // Substitui espaços por pontos
      .replace(/\.+/g, '.') // Remove pontos duplicados
      .replace(/^\.|\.$/g, ''); // Remove pontos no início e fim

    const email = `${nomeNormalizado}@expatriamente.com`;
    const password = await bcrypt.hash('Expatriamente2025!', 10);

    try {
      const funcionario = await prisma.user.create({
        data: {
          name: psicanalista.nome,
          email: email,
          password: password,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          clientId: clientId,
          emailVerified: false, // Não verificado para forçar mudança
          phone: psicanalista.contato,
        },
      });
      console.log('✅ Funcionário criado:', funcionario.email);
    } catch (error) {
      console.error('❌ Erro ao criar funcionário:', psicanalista.nome, error);
    }
  }

  console.log('🎉 Seed concluído!');
  console.log('📋 Resumo:');
  console.log('- Admin: admin@expatriamente.com (senha: admin123)');
  console.log(`- Funcionários: ${funcionarios.length} criados com senha Expatriamente2025!`);
  console.log(
    '- Todos os funcionários terão que mudar suas credenciais na primeira vez que acessarem',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
