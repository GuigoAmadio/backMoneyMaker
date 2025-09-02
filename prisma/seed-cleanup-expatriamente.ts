import { PrismaClient, UserStatus, UserRole, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ID fixo do cliente Expatriamente
const CLIENT_ID = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

// Util: parser de horários dos psicanalistas
function parseHorarios(horarios: string[] = []): Record<string, string[]> {
  const working: Record<string, string[]> = {};
  const diasSemana = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  horarios.forEach((linha) => {
    const m = linha.match(/(\d+)[a-zà-ú]*\s*-\s*(.+)/i);
    if (!m) return;
    const dia = parseInt(m[1], 10);
    const blocos = m[2].split(/[,e]/).map((s) => s.trim());

    const horas: string[] = [];
    for (const b of blocos) {
      const h1 = b.match(/^(\d{1,2}):(\d{2})$/);
      if (h1) {
        horas.push(`${h1[1].padStart(2, '0')}:${h1[2]}`);
        continue;
      }
      const h2 = b.match(/^(\d{1,2})h(\d{2})/);
      if (h2) {
        horas.push(`${h2[1].padStart(2, '0')}:${h2[2]}`);
        continue;
      }
      const h3 = b.match(/^(\d{1,2}):(\d{2})\s*às/);
      if (h3) {
        horas.push(`${h3[1].padStart(2, '0')}:${h3[2]}`);
        continue;
      }
      // Adicionar suporte para horários como "6h30 às 7h30"
      const h4 = b.match(/^(\d{1,2})h(\d{2})\s*às\s*(\d{1,2})h(\d{2})/);
      if (h4) {
        horas.push(`${h4[1].padStart(2, '0')}:${h4[2]}`);
        horas.push(`${h4[3].padStart(2, '0')}:${h4[4]}`);
        continue;
      }
    }

    const unicos = [...new Set(horas)].sort();
    if (dia >= 1 && dia <= 7 && unicos.length > 0) {
      working[diasSemana[dia - 1]] = unicos;
    }
  });

  return working;
}

async function main() {
  console.log('🧹 Seed de Limpeza - Expatriamente');
  console.log('📋 Operações:');
  console.log('   - Deletar todos os agendamentos');
  console.log('   - Deletar todos os users (exceto EMPLOYEE)');
  console.log('   - Atualizar horários de trabalho dos funcionários');

  try {
    // 1) Verificar se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: CLIENT_ID },
    });

    if (!client) {
      console.log('❌ Cliente não encontrado. Criando...');
      await prisma.client.create({
        data: {
          id: CLIENT_ID,
          name: 'Expatriamente',
          slug: 'expatriamente',
          email: 'contato@expatriamente.com',
          status: 'ACTIVE',
          plan: 'premium',
        },
      });
    }

    // 2) Deletar todos os agendamentos
    console.log('🗑️ Deletando agendamentos...');
    const deletedAppointments = await prisma.appointment.deleteMany({
      where: { clientId: CLIENT_ID },
    });
    console.log(`   ✅ ${deletedAppointments.count} agendamentos deletados`);

    // 4) Deletar annotations relacionadas a agendamentos
    console.log('🗑️ Deletando annotations...');
    const deletedAnnotations = await prisma.annotation.deleteMany({
      where: { clientId: CLIENT_ID },
    });
    console.log(`   ✅ ${deletedAnnotations.count} annotations deletadas`);

    // 5) Deletar todos os users que NÃO são EMPLOYEE
    console.log('🗑️ Deletando users (exceto EMPLOYEE)...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        clientId: CLIENT_ID,
        role: {
          equals: 'CLIENT',
        },
      },
    });
    console.log(`   ✅ ${deletedUsers.count} users deletados (não-EMPLOYEE)`);

    // 6) Ler psicanalistas.json para atualizar horários
    console.log('📖 Lendo psicanalistas.json...');
    const psicanalistasPath = path.join(__dirname, 'psicanalistas.json');
    const json = fs.readFileSync(psicanalistasPath, 'utf-8');
    const psicanalistas: Array<{
      nome: string;
      foto?: string;
      contato?: string;
      convite?: string;
      horarios?: string[];
      observacoes?: string;
    }> = JSON.parse(json);

    // 7) Atualizar horários de trabalho dos funcionários existentes
    console.log('🔄 Atualizando horários de trabalho dos funcionários...');

    const employees = await prisma.employee.findMany({
      where: { clientId: CLIENT_ID },
      include: { user: true },
    });

    for (const employee of employees) {
      // Encontrar psicanalista correspondente por nome
      const psicanalista = psicanalistas.find(
        (p) =>
          p.nome.toLowerCase().includes(employee.name.toLowerCase()) ||
          employee.name.toLowerCase().includes(p.nome.toLowerCase()),
      );

      if (psicanalista && psicanalista.horarios) {
        const workingHours = parseHorarios(psicanalista.horarios);

        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            workingHours: workingHours,
          },
        });

        console.log(`   ✅ ${employee.name}: horários atualizados`);
      } else {
        // Se cair aqui, significa que o funcionário não terá horários após a limpeza
        console.log(
          `   ⚠️ ${employee.name}: psicanalista não encontrado ou sem horários. Horários deste empregado ficarão vazios.`,
        );
      }
    }
    // Após o loop, listar todos os empregados que ficaram com horários vazios
    const empregadosSemHorario = employees.filter((employee) => {
      const psicanalista = psicanalistas.find(
        (p) =>
          p.nome.toLowerCase().includes(employee.name.toLowerCase()) ||
          employee.name.toLowerCase().includes(p.nome.toLowerCase()),
      );
      return !(psicanalista && psicanalista.horarios && psicanalista.horarios.length > 0);
    });

    if (empregadosSemHorario.length > 0) {
      console.log('\n🚨 Empregados que ficaram com horários vazios:');
      empregadosSemHorario.forEach((emp) => {
        console.log(`   - ${emp.name}`);
      });
    } else {
      console.log('\n✅ Nenhum empregado ficou com horários vazios.');
    }

    // 9) Estatísticas finais
    const finalStats = await prisma.$transaction([
      prisma.appointment.count({ where: { clientId: CLIENT_ID } }),
      prisma.user.count({ where: { clientId: CLIENT_ID } }),
      prisma.employee.count({ where: { clientId: CLIENT_ID } }),
    ]);

    console.log('\n📊 Estatísticas finais:');
    console.log(`   - Agendamentos: ${finalStats[0]}`);
    console.log(`   - Users: ${finalStats[1]}`);
    console.log(`   - Employees: ${finalStats[2]}`);

    console.log('\n✅ Seed de limpeza concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
