import { PrismaClient, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Gera hash da senha
  const senhaHash = await bcrypt.hash('senha123', 12);

  // Garante que existe pelo menos um Client
  let client = await prisma.client.findFirst();
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Cliente Exemplo',
        slug: 'cliente-exemplo',
        email: 'cliente@exemplo.com',
        status: 'ACTIVE',
        plan: 'basic',
      },
    });
  }

  // Garante que existe pelo menos um User
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Usuário Exemplo',
        email: 'usuario@exemplo.com',
        password: senhaHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        clientId: client.id,
        emailVerified: true,
      },
    });
  }

  // Garante que existe pelo menos um Employee
  let employee = await prisma.employee.findFirst();
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        name: 'Funcionário Exemplo',
        email: 'funcionario@exemplo.com',
        position: 'Atendente',
        clientId: client.id,
        isActive: true,
      },
    });
  }

  // Criar alguns serviços de exemplo
  const service1 = await prisma.service.create({
    data: {
      name: 'Consultoria Pessoal',
      description: 'Sessão de consultoria e organização pessoal',
      duration: 60,
      price: 150.0,
      clientId: client.id,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Reunião de Planejamento',
      description: 'Reunião para planejamento de projetos pessoais',
      duration: 90,
      price: 200.0,
      clientId: client.id,
    },
  });

  const service3 = await prisma.service.create({
    data: {
      name: 'Sessão de Mentoria',
      description: 'Mentoria individual para desenvolvimento pessoal',
      duration: 45,
      price: 120.0,
      clientId: client.id,
    },
  });

  const service4 = await prisma.service.create({
    data: {
      name: 'Acompanhamento de Resultados',
      description: 'Sessão para acompanhamento de metas e resultados',
      duration: 30,
      price: 80.0,
      clientId: client.id,
    },
  });

  // Criar agendamentos de exemplo
  await prisma.appointment.create({
    data: {
      clientId: client.id,
      userId: user.id,
      employeeId: employee.id,
      serviceId: service1.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // amanhã
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // +1h
      status: AppointmentStatus.SCHEDULED,
      description: 'Consultoria sobre organização de rotina',
    },
  });

  await prisma.appointment.create({
    data: {
      clientId: client.id,
      userId: user.id,
      employeeId: employee.id,
      serviceId: service2.id,
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // depois de amanhã
      endTime: new Date(Date.now() + 49 * 60 * 60 * 1000), // +1h
      status: AppointmentStatus.CONFIRMED,
      description: 'Planejamento de metas para 2024',
    },
  });

  // Criar mais 10 agendamentos variados
  const services = [service1, service2, service3, service4];
  const statuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.NO_SHOW,
  ];
  for (let i = 0; i < 10; i++) {
    const service = services[i % services.length];
    const status = statuses[i % statuses.length];
    const start = new Date(Date.now() + (72 + i * 2) * 60 * 60 * 1000); // começa daqui 3 dias + i*2h
    const end = new Date(start.getTime() + service.duration * 60 * 1000);
    await prisma.appointment.create({
      data: {
        clientId: client.id,
        userId: user.id,
        employeeId: employee.id,
        serviceId: service.id,
        startTime: start,
        endTime: end,
        status: status,
        description: `Agendamento de exemplo #${i + 3} (${service.name})`,
      },
    });
  }

  console.log('Seed concluído: services, appointments e usuário com senha criptografada!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
