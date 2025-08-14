import { PrismaClient, UserRole, UserStatus, AppointmentStatus, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tenant fixo usado no seed simples
const CLIENT_ID = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

type WorkingHours = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  string[]
>;

function emptyWorkingHours(): WorkingHours {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

// Converte linhas “2a - 8:00, 10:00 e 16:00” em WorkingHours
function parseHorarios(horarios: string[] = []): WorkingHours {
  const working = emptyWorkingHours();
  const diasSemana = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

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
      const key = diasSemana[dia - 1];
      (working as any)[key] = unicos;
    }
  });

  return working;
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function generateEmailFromName(name: string) {
  return `${normalize(name)}@expatriamente.com`;
}

function nextMonday(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = Sun
  const diff = (day === 0 ? 1 : 8 - day) % 7; // days to next Monday
  date.setUTCDate(date.getUTCDate() + (diff === 0 ? 7 : diff));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dateFromWeekday(baseMonday: Date, weekday: number): Date {
  return addDays(baseMonday, weekday);
}

async function main() {
  console.log('🌱 Seed pesado – Expatriamente (users + appointments)');

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

  // 1) Limpeza hard do tenant
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

  console.log('🧹 Limpando tenant...');
  await cleanupTenant(CLIENT_ID);

  // 2) Criar Client e Admin
  const client = await prisma.client.create({
    data: {
      id: CLIENT_ID,
      name: 'Expatriamente',
      slug: 'expatriamente',
      email: 'contato@expatriamente.com',
      plan: 'premium',
      status: 'ACTIVE',
      settings: {},
    },
  });

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
  console.log('✅ Admin:', admin.email);

  // 3) Criar Employees a partir do JSON
  const defaultPassword = 'Expatriamente2025!';
  const hashedDefault = await bcrypt.hash(defaultPassword, 10);

  const createdEmployees: { id: string; workingHours: WorkingHours }[] = [];
  for (const p of psicanalistas) {
    const email = generateEmailFromName(p.nome);
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
        isActive,
      } as any,
    });

    await prisma.user.update({ where: { id: user.id }, data: { employeeId: employee.id } });
    createdEmployees.push({ id: employee.id, workingHours });
  }
  console.log(`✅ Funcionários: ${createdEmployees.length}`);

  // 4) Serviço
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
      employees: { connect: createdEmployees.map((e) => ({ id: e.id })) },
    },
  });

  // 5) Preparar slots disponíveis nas próximas 3 semanas (a partir da próxima segunda)
  const baseMonday = nextMonday(new Date());
  const WEEKS = 3;
  const dowToKey: Record<number, keyof WorkingHours> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  } as const;

  const employeeSlots = new Map<string, Date[]>();
  for (const e of createdEmployees) {
    const slots: Date[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let dow = 0; dow < 7; dow++) {
        const dayKey = dowToKey[dow];
        const hours = e.workingHours[dayKey] || [];
        if (!hours.length) continue;
        const dayDate = addDays(baseMonday, w * 7 + dow);
        for (const hhmm of hours) {
          const [hh, mm] = hhmm.split(':').map((n) => parseInt(n, 10));
          const slot = new Date(dayDate);
          slot.setUTCHours(hh, mm, 0, 0);
          if (slot.getTime() > Date.now()) {
            slots.push(slot);
          }
        }
      }
    }
    employeeSlots.set(
      e.id,
      slots.sort((a, b) => a.getTime() - b.getTime()),
    );
  }

  const totalCapacity = Array.from(employeeSlots.values()).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );
  console.log(`📅 Capacidade de slots (3 semanas): ${totalCapacity}`);

  // 6) Criar usuários de teste com senha padrão
  const TARGET_USERS = 50;
  const MIN_PER_USER = 1; // garantir ao menos 1
  const MAX_PER_USER = 7; // objetivo 3-7, mas adaptamos à capacidade

  let possibleUsers = TARGET_USERS;
  if (totalCapacity < TARGET_USERS * MIN_PER_USER) {
    possibleUsers = Math.max(1, Math.floor(totalCapacity / MIN_PER_USER));
  }

  const userPassword = await bcrypt.hash('user123', 10);
  const users = [] as { id: string; name: string }[];
  for (let i = 1; i <= possibleUsers; i++) {
    const name = `Test User ${i.toString().padStart(3, '0')}`;
    const email = `user${i.toString().padStart(3, '0')}@expatriamente.com`;
    const u = await prisma.user.create({
      data: {
        clientId: client.id,
        name,
        email,
        password: userPassword,
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    users.push({ id: u.id, name });
  }
  console.log(`✅ Usuários criados: ${users.length} (senha padrão: user123)`);

  // 7) Agendar 3–7 por usuário sem colisão por funcionário
  const booked = new Map<string, Set<string>>(); // employeeId -> Set(ISO)
  const userBooked = new Map<string, Set<string>>(); // userId -> Set(ISO) para evitar choques do próprio usuário
  for (const [empId, slots] of employeeSlots) {
    booked.set(empId, new Set());
  }

  function tryPickSlot(): { employeeId: string; start: Date } | null {
    // Filtra somente funcionários com slots disponíveis não reservados
    const candidates = Array.from(employeeSlots.entries()).filter(([empId, slots]) => {
      const taken = booked.get(empId) || new Set<string>();
      return slots.some((s) => !taken.has(s.toISOString()));
    });
    if (candidates.length === 0) return null;

    // Tentar alguns picks aleatórios e, em seguida, fallback linear
    for (let attempts = 0; attempts < candidates.length * 2; attempts++) {
      const [empId, slots] = candidates[Math.floor(Math.random() * candidates.length)];
      const taken = booked.get(empId)!;
      if (!slots || slots.length === 0) continue;
      for (let j = 0; j < Math.min(10, slots.length); j++) {
        const s = slots[Math.floor(Math.random() * slots.length)];
        if (!s) continue;
        const iso = s.toISOString();
        if (!taken.has(iso)) {
          return { employeeId: empId, start: s };
        }
      }
    }

    // fallback determinístico
    for (const [empId, slots] of candidates) {
      const taken = booked.get(empId)!;
      for (const s of slots) {
        const iso = s.toISOString();
        if (!taken.has(iso)) return { employeeId: empId, start: s };
      }
    }
    return null;
  }

  const createdAppointments: string[] = [];
  for (const u of users) {
    // alvo 3–7, mas limitado por capacidade restante
    const remainingCapacity = totalCapacity - createdAppointments.length;
    if (remainingCapacity <= 0) break;

    const min = Math.min(3, remainingCapacity); // pelo menos 3 se houver capacidade
    const max = Math.min(MAX_PER_USER, remainingCapacity);
    const count = Math.max(1, Math.floor(Math.random() * (max - min + 1)) + min);

    const ub = new Set<string>();
    userBooked.set(u.id, ub);

    let createdForUser = 0;
    for (let k = 0; k < count; k++) {
      const pick = tryPickSlot();
      if (!pick) break;
      const iso = pick.start.toISOString();
      if (ub.has(iso)) {
        // já tem um no mesmo horário por outro funcionário; pular
        continue;
      }

      // marcar como reservado
      booked.get(pick.employeeId)!.add(iso);
      ub.add(iso);

      const end = new Date(pick.start);
      end.setUTCHours(end.getUTCHours() + 1);

      const apt = await prisma.appointment.create({
        data: {
          clientId: client.id,
          userId: u.id,
          employeeId: pick.employeeId,
          serviceId: service.id,
          startTime: pick.start,
          endTime: end,
          status: AppointmentStatus.SCHEDULED,
        },
      });
      createdAppointments.push(apt.id);
      createdForUser++;
    }

    // garantir pelo menos 1 por usuário
    if (createdForUser === 0) {
      const pick = tryPickSlot();
      if (pick) {
        const iso = pick.start.toISOString();
        if (!booked.get(pick.employeeId)!.has(iso) && !ub.has(iso)) {
          booked.get(pick.employeeId)!.add(iso);
          ub.add(iso);
          const end = new Date(pick.start);
          end.setUTCHours(end.getUTCHours() + 1);
          const apt = await prisma.appointment.create({
            data: {
              clientId: client.id,
              userId: u.id,
              employeeId: pick.employeeId,
              serviceId: service.id,
              startTime: pick.start,
              endTime: end,
              status: AppointmentStatus.SCHEDULED,
            },
          });
          createdAppointments.push(apt.id);
        }
      }
    }
  }

  console.log(`📈 Agendamentos criados: ${createdAppointments.length}`);
  console.log('🎉 Seed pesado concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed pesado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
