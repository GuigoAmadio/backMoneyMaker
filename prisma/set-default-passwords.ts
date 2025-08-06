import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Iniciando definição de senhas padrão para psicanalistas...');

  // Senha padrão para todos os psicanalistas
  const defaultPassword = 'Expatriamente2024!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Buscar todos os empregados do cliente Expatriamente que não têm senha definida
  const employees = await prisma.employee.findMany({
    where: {
      client: {
        slug: 'expatriamente',
      },
      password: null, // Apenas os que não têm senha
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`📋 Encontrados ${employees.length} psicanalistas sem senha`);

  if (employees.length === 0) {
    console.log('✅ Todos os psicanalistas já têm senha definida');
    return;
  }

  // Atualizar senha para todos os empregados encontrados
  const updatePromises = employees.map((employee) =>
    prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword },
    }),
  );

  await Promise.all(updatePromises);

  console.log('✅ Senhas padrão definidas para todos os psicanalistas');
  console.log('\n📋 Lista de psicanalistas atualizados:');

  employees.forEach((employee, index) => {
    console.log(`${index + 1}. ${employee.name}`);
    console.log(`   📧 Email: ${employee.email}`);
    console.log(`   🔐 Senha padrão: ${defaultPassword}`);
    console.log('');
  });

  console.log('⚠️  IMPORTANTE:');
  console.log('   - Todos os psicanalistas devem alterar suas senhas no primeiro acesso');
  console.log('   - A senha padrão é: Expatriamente2024!');
  console.log('   - Recomenda-se desabilitar o acesso após o primeiro login');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a definição de senhas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
