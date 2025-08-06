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
  console.log('👥 Criando employees baseado no psicanalistas.json...');

  // Client ID do Expatriamente
  const clientId = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

  // Verificar se o client existe
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    console.error('❌ Client não encontrado. Execute primeiro o seed completo.');
    return;
  }

  console.log('✅ Client encontrado:', client.name);

  // Filtrar psicanalistas que aceitaram convite
  const funcionarios = psicanalistas.filter((p) => p.convite === 'Sim');

  let createdCount = 0;
  let updatedCount = 0;

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

    try {
      // Verificar se o employee já existe
      const existingEmployee = await prisma.employee.findUnique({
        where: {
          clientId_email: {
            clientId: clientId,
            email: email,
          },
        },
      });

      if (existingEmployee) {
        // Atualizar employee existente
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            name: psicanalista.nome,
            phone: psicanalista.contato,
            position: 'Psicanalista Clínico',
            description:
              psicanalista.observacoes || 'Psicanalista especializado em atendimento clínico',
            workingHours: psicanalista.horarios || [],
            isActive: true,
          },
        });
        console.log('🔄 Employee atualizado:', psicanalista.nome);
        updatedCount++;
      } else {
        // Criar novo employee
        const employee = await prisma.employee.create({
          data: {
            name: psicanalista.nome,
            email: email,
            phone: psicanalista.contato,
            position: 'Psicanalista Clínico',
            description:
              psicanalista.observacoes || 'Psicanalista especializado em atendimento clínico',
            workingHours: psicanalista.horarios || [],
            isActive: true,
            clientId: clientId,
          },
        });
        console.log('✅ Employee criado:', employee.name);
        createdCount++;
      }
    } catch (error) {
      console.error('❌ Erro ao processar psicanalista:', psicanalista.nome, error);
    }
  }

  console.log('�� Processo concluído!');
  console.log('📋 Resumo:');
  console.log(`- Employees criados: ${createdCount}`);
  console.log(`- Employees atualizados: ${updatedCount}`);
  console.log(`- Total processados: ${funcionarios.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
