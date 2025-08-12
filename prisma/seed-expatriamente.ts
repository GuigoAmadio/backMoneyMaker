import { PrismaClient, UserStatus, UserRole, Prisma } from '@prisma/client';
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

async function main() {
  console.log('🌱 Seed (produção simplificada) - Expatriamente');

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

  // 2) Criar client com ID fixo
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

  // 3) Admin
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

  // 4) Funcionários (users + employees) com senha padrão
  const defaultPassword = 'Expatriamente2025!';
  const hashedDefault = await bcrypt.hash(defaultPassword, 10);

  const createdEmployees: { id: string }[] = [];

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

    createdEmployees.push({ id: employee.id });
  }
  console.log(`✅ Funcionários criados: ${createdEmployees.length}`);
  console.log(`   🔐 Senha padrão: ${defaultPassword}`);

  // 5) Categoria e Serviço
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
      employees: { connect: createdEmployees }, // conecta todos os funcionários
    },
  });

  console.log('✅ Categoria e Serviço criados:', category.name, ' / ', service.name);
  console.log('🎉 Seed finalizado com sucesso para o tenant:', client.id);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
