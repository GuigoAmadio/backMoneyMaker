import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do Expatriamente...');

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

  // 2. Criar 5 empregados (psicanalistas)
  const employees = [];
  const employeeNames = [
    'Dr. Ana Silva',
    'Dr. Carlos Mendes',
    'Dra. Maria Santos',
    'Dr. João Oliveira',
    'Dra. Paula Costa',
  ];

  const employeeDescriptions = [
    'Especialista em terapia cognitivo-comportamental',
    'Psicanalista com foco em relacionamentos',
    'Especialista em ansiedade e depressão',
    'Psicólogo infantil e adolescente',
    'Terapeuta familiar e de casais',
  ];

  for (let i = 0; i < 5; i++) {
    const employee = await prisma.employee.upsert({
      where: {
        clientId_email: {
          clientId: client.id,
          email: `psicanalista${i + 1}@expatriamente.com`,
        },
      },
      update: {},
      create: {
        clientId: client.id,
        name: employeeNames[i],
        email: `psicanalista${i + 1}@expatriamente.com`,
        phone: `(11) 9${String(i + 1).padStart(4, '0')}-0000`,
        position: 'Psicanalista',
        description: employeeDescriptions[i],
        avatar: `/funcionarios/${employeeNames[i].replace(' ', ' ')}.jpg`,
        workingHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        isActive: true,
      },
    });
    employees.push(employee);
  }
  console.log('✅ 5 Employees criados');

  // 3. Criar 50 clientes
  const clients = [];
  for (let i = 1; i <= 50; i++) {
    const clientUser = await prisma.user.upsert({
      where: {
        clientId_email: {
          clientId: client.id,
          email: `cliente${i}@expatriamente.com`,
        },
      },
      update: {},
      create: {
        clientId: client.id,
        name: `Cliente ${i}`,
        email: `cliente${i}@expatriamente.com`,
        phone: `(11) 9${String(i).padStart(4, '0')}-0000`,
        password: 'senha123',
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    clients.push(clientUser);
  }
  console.log('✅ 50 Clientes criados');

  // 4. Criar serviço de psicanálise
  const service = await prisma.service.upsert({
    where: { id: 'serv-psicanalise' },
    update: {},
    create: {
      id: 'serv-psicanalise',
      clientId: client.id,
      name: 'Sessão de Psicanálise',
      description: 'Atendimento individual com psicanalista',
      duration: 60,
      price: 200,
      isActive: true,
    },
  });

  // 5. Limpar appointments existentes
  await prisma.appointment.deleteMany({
    where: { clientId: client.id },
  });

  // 6. Criar appointments distribuídos ao longo de um mês
  const now = new Date();
  let appointmentCount = 0;

  // Para cada empregado, criar 10 consultas com clientes diferentes
  for (let employeeIndex = 0; employeeIndex < employees.length; employeeIndex++) {
    const employee = employees[employeeIndex];

    // Pegar 10 clientes diferentes para este empregado
    const startClientIndex = employeeIndex * 10;
    const endClientIndex = startClientIndex + 10;
    const clientsForEmployee = clients.slice(startClientIndex, endClientIndex);

    console.log(
      `📅 Criando consultas para ${employee.name} com ${clientsForEmployee.length} clientes`,
    );

    for (let clientIndex = 0; clientIndex < clientsForEmployee.length; clientIndex++) {
      const clientUser = clientsForEmployee[clientIndex];

      // Distribuir consultas ao longo de 30 dias
      const appointmentDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + clientIndex + 1, // +1 para começar amanhã
        0,
        0,
        0,
        0,
      );

      // Horários de trabalho: 9h, 10h, 11h, 14h, 15h, 16h, 17h
      const workingHours = [9, 10, 11, 14, 15, 16, 17];
      const hourIndex = clientIndex % workingHours.length;
      const appointmentHour = workingHours[hourIndex];

      const startTime = new Date(
        appointmentDay.getFullYear(),
        appointmentDay.getMonth(),
        appointmentDay.getDate(),
        appointmentHour,
        0,
        0,
        0,
      );

      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora

      await prisma.appointment.create({
        data: {
          startTime,
          endTime,
          status: 'SCHEDULED',
          clientId: client.id,
          userId: clientUser.id,
          employeeId: employee.id,
          serviceId: service.id,
        },
      });
      appointmentCount++;
    }
  }

  console.log('✅ Appointments criados:', appointmentCount);
  console.log('📊 Resumo:');
  console.log(`   - ${employees.length} empregados`);
  console.log(`   - ${clients.length} clientes`);
  console.log(`   - ${appointmentCount} consultas agendadas`);
  console.log(`   - Cada empregado tem ${appointmentCount / employees.length} consultas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
