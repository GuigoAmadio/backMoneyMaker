import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface Psicanalista {
  nome: string;
  foto: string;
  contato: string;
  convite: string;
  horarios: string[];
  observacoes: string;
}

// Função para converter horários de texto para formato estruturado
function parseHorarios(horarios: string[]): any {
  const workingHours: any = {};

  horarios.forEach((horario) => {
    // Padrões encontrados no JSON:
    // "2a - 8:00, 10:00, 16:00 e 19:30"
    // "3a - 10:00 e 15:00"
    // "4a - 14:00 e 15:00"
    // "2a - 8:00 e 09:00, 19:00 e 20:00."
    // "6a - 08:00, 09:00, 10:00, 11:00, 15:00, 16:00, 17:00, 18:00, 19:00, 21:00"
    // "4a - 16:00 às 20:00 horas horário do Brasil"
    // "5a - 18:00, 19:00, 20:00 e 21:00."

    const match = horario.match(/(\d+)[a-z]\s*-\s*(.+)/);
    if (match) {
      const dia = parseInt(match[1]);
      const horariosStr = match[2];

      // Extrair horários - lidar com diferentes formatos
      const horariosArray: string[] = [];

      // Dividir por vírgulas e "e"
      const partes = horariosStr.split(/[,e]/);

      partes.forEach((parte) => {
        const trimmed = parte.trim();

        // Padrões de horário encontrados:
        // "8:00", "09:00", "6h30 às 7h30", "16:00 às 20:00"

        // Padrão 1: "8:00" ou "09:00"
        const horaSimples = trimmed.match(/^(\d{1,2}):(\d{2})$/);
        if (horaSimples) {
          const hour = parseInt(horaSimples[1]);
          const minute = parseInt(horaSimples[2]);
          horariosArray.push(
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          );
        }

        // Padrão 2: "6h30 às 7h30" - pegar apenas o primeiro horário
        const horaComH = trimmed.match(/^(\d{1,2})h(\d{2})/);
        if (horaComH) {
          const hour = parseInt(horaComH[1]);
          const minute = parseInt(horaComH[2]);
          horariosArray.push(
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          );
        }

        // Padrão 3: "16:00 às 20:00" - pegar apenas o primeiro horário
        const horaComAs = trimmed.match(/^(\d{1,2}):(\d{2})\s*às/);
        if (horaComAs) {
          const hour = parseInt(horaComAs[1]);
          const minute = parseInt(horaComAs[2]);
          horariosArray.push(
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          );
        }
      });

      // Remover duplicatas e ordenar
      const horariosUnicos = [...new Set(horariosArray)].sort();

      // Mapear dia da semana (1=segunda, 2=terça, etc.)
      const diasSemana = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      if (dia >= 1 && dia <= 7 && horariosUnicos.length > 0) {
        workingHours[diasSemana[dia - 1]] = horariosUnicos;
      }
    }
  });

  return workingHours;
}

// Função para gerar email baseado no nome
function generateEmail(nome: string): string {
  const normalizedName = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '.') // Substitui espaços por pontos
    .replace(/\.+/g, '.') // Remove pontos duplicados
    .replace(/^\.|\.$/g, ''); // Remove pontos no início e fim

  return `${normalizedName}@expatriamente.com`;
}

async function main() {
  console.log('🌱 Iniciando seed atualizado do Expatriamente...');

  // 1. Criar cliente Expatriamente
  const client = await prisma.client.upsert({
    where: { slug: 'expatriamente' },
    update: {},
    create: {
      name: 'Expatriamente',
      slug: 'expatriamente',
      email: 'contato@expatriamente.com',
      phone: '(11) 99999-9999',
      logo: '/logoFinal.svg',
      website: 'https://expatriamente.com',
      status: 'ACTIVE',
      plan: 'premium',
      settings: {},
    },
  });
  console.log('✅ Cliente Expatriamente criado:', client.id);

  // 2. LIMPAR TODOS OS EMPREGADOS EXISTENTES DO CLIENTE
  console.log('🧹 Limpando empregados existentes...');
  await prisma.employee.deleteMany({
    where: { clientId: client.id },
  });
  console.log('✅ Empregados removidos');

  // 3. Ler arquivo psicanalistas.json
  const psicanalistasPath = path.join(__dirname, 'psicanalistas.json');
  const psicanalistasData = fs.readFileSync(psicanalistasPath, 'utf-8');
  const psicanalistas: Psicanalista[] = JSON.parse(psicanalistasData);

  console.log(` Encontrados ${psicanalistas.length} psicanalistas no arquivo`);

  // 4. Criar empregados baseados nos psicanalistas
  const employees = [];
  let psicanalistasCriados = 0;
  let psicanalistasPulados = 0;

  // Senha padrão para todos os psicanalistas
  const defaultPassword = 'Expatriamente2024!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (const psicanalista of psicanalistas) {
    // Verificar se tem convite aceito
    if (psicanalista.convite !== 'Sim') {
      console.log(`⏭️ Pulando ${psicanalista.nome} - convite: "${psicanalista.convite}"`);
      psicanalistasPulados++;
      continue;
    }

    const email = generateEmail(psicanalista.nome);
    const workingHours = parseHorarios(psicanalista.horarios);

    // Verificar se tem horários válidos
    const diasComHorarios = Object.keys(workingHours).length;
    if (diasComHorarios === 0) {
      console.log(`⏭️ Pulando ${psicanalista.nome} - sem horários válidos`);
      psicanalistasPulados++;
      continue;
    }

    const employee = await prisma.employee.create({
      data: {
        clientId: client.id,
        name: psicanalista.nome,
        email: email,
        phone: psicanalista.contato,
        avatar: psicanalista.foto,
        position: 'Psicanalista',
        description:
          psicanalista.observacoes || 'Psicanalista especializado em atendimento a expatriados',
        workingHours: workingHours,
        isActive: true,
      },
    });

    employees.push(employee);
    psicanalistasCriados++;
    console.log(`✅ Psicanalista criado: ${psicanalista.nome}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔐 Senha padrão: ${defaultPassword}`);
    console.log(`   📅 Horários: ${diasComHorarios} dias da semana`);
    console.log(`   📞 Contato: ${psicanalista.contato}`);

    // Mostrar horários detalhados
    Object.entries(workingHours).forEach(([dia, horarios]) => {
      if (Array.isArray(horarios)) {
        console.log(`      ${dia}: ${horarios.join(', ')}`);
      } else {
        console.log(`      ${dia}: ${horarios}`);
      }
    });
  }

  console.log('\n📊 Resumo:');
  console.log(`   - Total de psicanalistas no JSON: ${psicanalistas.length}`);
  console.log(`   - Psicanalistas criados: ${psicanalistasCriados}`);
  console.log(`   - Psicanalistas pulados: ${psicanalistasPulados}`);
  console.log(`   - Motivos para pular: convite não aceito ou sem horários válidos`);
  console.log(`\n🔐 Senha padrão para todos os psicanalistas: ${defaultPassword}`);
  console.log('⚠️  IMPORTANTE: Todos devem alterar suas senhas no primeiro acesso!');

  // 5. Criar serviço de psicanálise
  const service = await prisma.service.upsert({
    where: { id: 'serv-psicanalise-expatriamente' },
    update: {},
    create: {
      id: 'serv-psicanalise-expatriamente',
      clientId: client.id,
      name: 'Sessão de Psicanálise',
      description:
        'Atendimento individual com psicanalista especializado em questões de expatriação',
      duration: 60,
      price: 250.0,
      isActive: true,
    },
  });

  // 6. Associar todos os empregados ao serviço
  for (const employee of employees) {
    await prisma.service.update({
      where: { id: service.id },
      data: {
        employees: {
          connect: { id: employee.id },
        },
      },
    });
  }

  console.log('✅ Serviço de psicanálise criado e associado aos psicanalistas');
  console.log(' Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
