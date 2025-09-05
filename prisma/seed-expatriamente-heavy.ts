import { PrismaClient, UserStatus, UserRole, Prisma, AppointmentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ID fixo solicitado
const CLIENT_ID = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

// Util: parser de horários (reaproveitado e simplificado)
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
    }

    const unicos = [...new Set(horas)].sort();
    if (dia >= 1 && dia <= 7 && unicos.length > 0) {
      working[diasSemana[dia - 1]] = unicos;
    }
  });

  return working;
}

// Normaliza nome -> email
function generateEmail(nome: string): string {
  return (
    nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '') + '@expatriamente.com'
  );
}

// Gera usuários clientes fictícios
function generateFakeClients(count: number) {
  const firstNames = [
    'Ana',
    'Carlos',
    'Maria',
    'João',
    'Patricia',
    'Roberto',
    'Fernanda',
    'Ricardo',
    'Claudia',
    'Daniel',
    'Juliana',
    'Pedro',
    'Camila',
    'Rafael',
    'Luciana',
    'Thiago',
    'Beatriz',
    'Gustavo',
    'Adriana',
    'Marcelo',
    'Renata',
    'Felipe',
    'Carla',
    'Diego',
    'Priscila',
    'Bruno',
    'Natalia',
    'Leonardo',
    'Monica',
    'Andre',
    'Fabiana',
    'Lucas',
    'Tatiana',
    'Rodrigo',
    'Cristina',
    'Victor',
    'Simone',
    'Alexandre',
    'Vanessa',
    'Sergio',
  ];

  const lastNames = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Rodrigues',
    'Ferreira',
    'Alves',
    'Pereira',
    'Lima',
    'Gomes',
    'Costa',
    'Ribeiro',
    'Martins',
    'Carvalho',
    'Almeida',
    'Lopes',
    'Soares',
    'Fernandes',
    'Vieira',
    'Barbosa',
    'Rocha',
    'Dias',
    'Monteiro',
    'Cardoso',
    'Reis',
    'Araujo',
    'Correia',
    'Pinto',
    'Teixeira',
    'Machado',
    'Castro',
    'Freitas',
  ];

  const clients = [];
  const usedEmails = new Set<string>(); // Para garantir emails únicos

  for (let i = 0; i < count; i++) {
    let email: string;
    let fullName: string;
    let attempts = 0;

    // Tentar até 10 vezes para gerar um email único
    do {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      fullName = `${firstName} ${lastName}`;

      // Se for tentativa > 1, adicionar um número ao final
      if (attempts > 0) {
        email = generateEmail(`${fullName}${attempts}`);
      } else {
        email = generateEmail(fullName);
      }

      attempts++;
    } while (usedEmails.has(email) && attempts < 10);

    // Se ainda tiver conflito após 10 tentativas, usar timestamp
    if (usedEmails.has(email)) {
      email = generateEmail(`${fullName}${Date.now()}${i}`);
    }

    usedEmails.add(email);

    clients.push({
      name: fullName,
      email: email,
      phone: `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    });
  }

  return clients;
}

// Gera datas de agendamento para a semana atual e próximas
function generateAppointmentDates() {
  const dates = [];
  const now = new Date();

  // Começar da segunda-feira da semana atual
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Gerar agendamentos para as próximas 4 semanas
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + week * 7 + day);

      // Pular domingos para a maioria dos agendamentos
      if (day === 6 && Math.random() > 0.3) continue;

      // Horários de trabalho típicos de psicanalista
      const timeSlots = [
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
        '19:00',
      ];

      // Adicionar alguns horários por dia
      const slotsPerDay = Math.floor(Math.random() * 6) + 2; // 2-7 agendamentos por dia
      for (let slot = 0; slot < slotsPerDay; slot++) {
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const [hours, minutes] = timeSlot.split(':').map(Number);

        const appointmentDate = new Date(date);
        appointmentDate.setHours(hours, minutes, 0, 0);

        // Só adicionar se for no futuro ou no presente
        if (appointmentDate >= now) {
          dates.push(appointmentDate);
        }
      }
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
}

async function main() {
  console.log('🌱 Seed HEAVY (com muitos agendamentos) - Expatriamente');

  // 0) Ler psicanalistas.json
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

  // Helper para limpar um tenant específico
  const cleanupTenant = async (clientId: string) => {
    await prisma.appointment.deleteMany({ where: { clientId } });
    await prisma.order.deleteMany({ where: { clientId } });
    await prisma.product.deleteMany({ where: { clientId } });
    await prisma.service.deleteMany({ where: { clientId } });
    await prisma.category.deleteMany({ where: { clientId } });
    await prisma.employee.deleteMany({ where: { clientId } });
    await prisma.user.deleteMany({ where: { clientId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
  };

  // 1) Se já existe um client com o slug 'expatriamente' (mesmo com outro ID), limpar e remover
  const existingBySlug = await prisma.client.findUnique({ where: { slug: 'expatriamente' } });
  if (existingBySlug && existingBySlug.id !== CLIENT_ID) {
    console.log('🧹 Encontrado client por slug com ID diferente. Limpando:', existingBySlug.id);
    await cleanupTenant(existingBySlug.id);
  }

  // 2) Limpeza do tenant alvo (ID fixo)
  console.log('🧹 Limpando dados do tenant alvo...');
  await cleanupTenant(CLIENT_ID);

  // 3) Criar client com ID fixo
  const client = await prisma.client.create({
    data: {
      id: CLIENT_ID,
      name: 'Expatriamente',
      slug: 'expatriamente',
      email: 'contato@expatriamente.com',
      status: 'ACTIVE',
      plan: 'premium',
      settings: {},
    },
  });
  console.log('✅ Client criado:', client.id);

  // 4) Admin
  const admin = await prisma.user.create({
    data: {
      clientId: client.id,
      name: 'Admin Expatriamente',
      email: 'admin@expatriamente.com',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin criado:', admin.email);

  // 5) Funcionários (users + employees) com senha padrão
  const defaultPassword = 'Expatriamente2025!';
  const hashedDefault = await bcrypt.hash(defaultPassword, 10);

  const createdEmployees: { id: string; userId: string }[] = [];

  for (const p of psicanalistas) {
    const email = generateEmail(p.nome);
    const workingHours = parseHorarios(p.horarios || []);
    const isActive = (p.convite || '').trim().toLowerCase() === 'sim';

    const user = await prisma.user.create({
      data: {
        clientId: client.id,
        name: p.nome,
        email,
        phone: p.contato || null,
        avatar: p.foto || null,
        role: UserRole.EMPLOYEE,
        status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        password: hashedDefault,
        emailVerified: false,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        clientId: client.id,
        userId: user.id,
        name: p.nome,
        email,
        phone: p.contato || null,
        avatar: p.foto || null,
        position: 'Psicanalista Clínico',
        description: p.observacoes || 'Psicanalista especializado em atendimento clínico',
        workingHours: workingHours as any,
        isActive: isActive,
      } as any,
    });

    // vincular de volta no user.employee_id (opcional, mas útil)
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: employee.id },
    });

    createdEmployees.push({ id: employee.id, userId: user.id });
  }
  console.log(`✅ Funcionários criados: ${createdEmployees.length}`);
  console.log(`   🔐 Senha padrão: ${defaultPassword}`);

  // 6) Categoria e Serviço
  const category = await prisma.category.create({
    data: {
      clientId: client.id,
      name: 'Psicanálise',
      description: 'Categoria de serviços de psicanálise',
      color: '#01386F',
      isActive: true,
    },
  });

  const service = await prisma.service.create({
    data: {
      clientId: client.id,
      categoryId: category.id,
      name: 'Sessão de Psicanálise',
      description: 'Atendimento individual com psicanalista especializado',
      duration: 60,
      price: new Prisma.Decimal(250),
      isActive: true,
      employees: { connect: createdEmployees.map((emp) => ({ id: emp.id })) }, // conecta todos os funcionários
    },
  });

  console.log('✅ Categoria e Serviço criados:', category.name, ' / ', service.name);

  // 7) Criar usuários clientes fictícios
  console.log('👥 Criando usuários clientes fictícios...');
  const fakeClients = generateFakeClients(50); // 50 clientes fictícios
  const clientUsers: { id: string; name: string }[] = [];

  for (const fakeClient of fakeClients) {
    const clientUser = await prisma.user.create({
      data: {
        clientId: client.id,
        name: fakeClient.name,
        email: fakeClient.email,
        phone: fakeClient.phone,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        password: await bcrypt.hash('cliente123', 10),
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    clientUsers.push({ id: clientUser.id, name: clientUser.name });
  }
  console.log(`✅ Clientes fictícios criados: ${clientUsers.length}`);

  // 8) Criar MUITOS agendamentos
  console.log('📅 Criando agendamentos para semana atual e próximas...');
  const appointmentDates = generateAppointmentDates();
  const statuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.IN_PROGRESS,
  ];

  let appointmentsCreated = 0;

  for (const startTime of appointmentDates) {
    // Selecionar cliente e funcionário aleatórios
    const randomClient = clientUsers[Math.floor(Math.random() * clientUsers.length)];
    const randomEmployee = createdEmployees[Math.floor(Math.random() * createdEmployees.length)];

    // Calcular endTime (1 hora depois)
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Status baseado na data (agendamentos passados = COMPLETED, futuros = SCHEDULED/CONFIRMED)
    let appointmentStatus: AppointmentStatus;
    const now = new Date();
    if (startTime < now) {
      appointmentStatus =
        Math.random() > 0.8 ? AppointmentStatus.CANCELLED : AppointmentStatus.COMPLETED;
    } else {
      appointmentStatus =
        Math.random() > 0.7 ? AppointmentStatus.CONFIRMED : AppointmentStatus.SCHEDULED;
    }

    try {
      await prisma.appointment.create({
        data: {
          clientId: client.id,
          userId: randomClient.id,
          employeeId: randomEmployee.id,
          serviceId: service.id,
          startTime,
          endTime,
          status: appointmentStatus,
        },
      });
      appointmentsCreated++;
    } catch (error) {
      // Ignorar erros de conflito de horário
      console.log(`⚠️ Conflito de horário ignorado para ${startTime.toISOString()}`);
    }
  }

  console.log(`✅ Agendamentos criados: ${appointmentsCreated}`);
  console.log('🎉 Seed HEAVY finalizado com sucesso para o tenant:', client.id);

  // Estatísticas finais
  const totalAppointments = await prisma.appointment.count({ where: { clientId: client.id } });
  const scheduledCount = await prisma.appointment.count({
    where: { clientId: client.id, status: AppointmentStatus.SCHEDULED },
  });
  const confirmedCount = await prisma.appointment.count({
    where: { clientId: client.id, status: AppointmentStatus.CONFIRMED },
  });
  const completedCount = await prisma.appointment.count({
    where: { clientId: client.id, status: AppointmentStatus.COMPLETED },
  });

  console.log('📊 Estatísticas finais:');
  console.log(`   Total de agendamentos: ${totalAppointments}`);
  console.log(`   Agendados: ${scheduledCount}`);
  console.log(`   Confirmados: ${confirmedCount}`);
  console.log(`   Concluídos: ${completedCount}`);
  console.log(`   Funcionários ativos: ${createdEmployees.length}`);
  console.log(`   Clientes cadastrados: ${clientUsers.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
