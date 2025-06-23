import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed EXTENSO do banco de dados...');

  // Criar os 3 clientes
  const imobiliariaClient = await prisma.client.create({
    data: {
      name: 'Imobiliária Prime',
      slug: 'imobiliaria-prime',
      email: 'contato@imobiliariaprime.com.br',
      phone: '(11) 3333-1111',
      status: 'ACTIVE',
      plan: 'premium',
      settings: JSON.stringify({ type: 'imobiliaria', theme: 'green' }),
    },
  });

  const clinicaClient = await prisma.client.create({
    data: {
      name: 'Clínica São Paulo',
      slug: 'clinica-sao-paulo',
      email: 'contato@clinicasp.com.br',
      phone: '(11) 3333-2222',
      status: 'ACTIVE',
      plan: 'premium',
      settings: JSON.stringify({ type: 'clinica', theme: 'blue' }),
    },
  });

  const autopecasClient = await prisma.client.create({
    data: {
      name: 'AutoPeças Central',
      slug: 'autopecas-central',
      email: 'contato@autopecascentral.com.br',
      phone: '(11) 3333-3333',
      status: 'ACTIVE',
      plan: 'basic',
      settings: JSON.stringify({ type: 'autopecas', theme: 'red' }),
    },
  });

  console.log('✅ Clientes criados');

  // Criar usuários admin
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@moneymaker.dev',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      clientId: imobiliariaClient.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      name: 'Admin Imobiliária',
      email: 'admin@imobiliariaprime.com.br',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: imobiliariaClient.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      name: 'Admin Clínica',
      email: 'admin@clinicasp.com.br',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: clinicaClient.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      name: 'Admin AutoPeças',
      email: 'admin@autopecascentral.com.br',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      clientId: autopecasClient.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Usuários criados');

  // DADOS PARA IMOBILIÁRIA
  console.log('🏠 Criando dados da Imobiliária...');

  // Funcionários
  for (let i = 1; i <= 5; i++) {
    await prisma.employee.create({
      data: {
        clientId: imobiliariaClient.id,
        name: `Corretor ${i}`,
        email: `corretor${i}@imobiliariaprime.com.br`,
        position: 'Corretor',
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        workingHours: { monday: '08:00-18:00', tuesday: '08:00-18:00' },
      },
    });
  }

  // Imóveis
  const properties = [];
  for (let i = 1; i <= 10; i++) {
    const property = await prisma.property.create({
      data: {
        clientId: imobiliariaClient.id,
        title: `Imóvel ${i}`,
        type: 'APARTMENT',
        price: 500000 + i * 100000,
        area: 80 + i * 10,
        bedrooms: 2 + (i % 3),
        bathrooms: 1 + (i % 2),
        address: `Rua Exemplo, ${i * 100}`,
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
        neighborhood: 'Centro',
        images: ['https://via.placeholder.com/400x300'],
        amenities: ['Piscina', 'Academia'],
        features: ['Ar Condicionado'],
      },
    });
    properties.push(property);
  }

  // Leads
  for (let i = 1; i <= 5; i++) {
    await prisma.propertyLead.create({
      data: {
        clientId: imobiliariaClient.id,
        propertyId: properties[i - 1].id,
        name: `Lead ${i}`,
        email: `lead${i}@email.com`,
        phone: `(11) 9888${i.toString().padStart(4, '0')}`,
        message: `Interessado no imóvel ${i}`,
        source: 'site',
        status: 'NEW',
        priority: 'MEDIUM',
      },
    });
  }

  console.log('✅ Dados da Imobiliária criados - 10 imóveis, 5 funcionários, 5 leads');

  // DADOS PARA CLÍNICA
  console.log('🏥 Criando dados da Clínica...');

  const employees = [];
  for (let i = 1; i <= 5; i++) {
    const employee = await prisma.employee.create({
      data: {
        clientId: clinicaClient.id,
        name: `Dr. Médico ${i}`,
        email: `medico${i}@clinicasp.com.br`,
        position: 'Médico',
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        workingHours: { monday: '08:00-17:00', tuesday: '08:00-17:00' },
      },
    });
    employees.push(employee);
  }

  // Médicos
  const doctors = [];
  for (let i = 0; i < 3; i++) {
    const doctor = await prisma.doctor.create({
      data: {
        clientId: clinicaClient.id,
        employeeId: employees[i].id,
        crm: `${123456 + i}-SP`,
        specialty: ['Cardiologia', 'Dermatologia', 'Ortopedia'][i],
        consultationPrice: 300.0,
        schedule: { monday: '08:00-16:00', tuesday: '08:00-16:00' },
      },
    });
    doctors.push(doctor);
  }

  // Pacientes
  const patients = [];
  for (let i = 1; i <= 10; i++) {
    const patient = await prisma.patient.create({
      data: {
        clientId: clinicaClient.id,
        name: `Paciente ${i}`,
        phone: `(11) 9888${i.toString().padStart(4, '0')}`,
        email: `paciente${i}@email.com`,
        document: `${12345678900 + i}`,
        birthDate: new Date('1980-01-01'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
      },
    });
    patients.push(patient);
  }

  // Consultas
  for (let i = 0; i < 6; i++) {
    await prisma.doctorAppointment.create({
      data: {
        clientId: clinicaClient.id,
        doctorId: doctors[i % doctors.length].id,
        patientId: patients[i].id,
        scheduledAt: new Date('2024-06-25T09:00:00'),
        price: 300.0,
        symptoms: `Sintoma ${i + 1}`,
        status: 'SCHEDULED',
      },
    });
  }

  console.log('✅ Dados da Clínica criados - 3 médicos, 10 pacientes, 6 consultas');

  // DADOS PARA AUTOPEÇAS
  console.log('🔧 Criando dados da AutoPeças...');

  // Funcionários
  for (let i = 1; i <= 5; i++) {
    await prisma.employee.create({
      data: {
        clientId: autopecasClient.id,
        name: `Funcionário ${i}`,
        email: `func${i}@autopecascentral.com.br`,
        position: 'Vendedor',
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        workingHours: { monday: '08:00-18:00', tuesday: '08:00-18:00' },
      },
    });
  }

  // Fornecedores
  for (let i = 1; i <= 5; i++) {
    await prisma.supplier.create({
      data: {
        clientId: autopecasClient.id,
        name: `Fornecedor ${i}`,
        document: `${12345678000100 + i}`,
        email: `fornecedor${i}@email.com`,
        phone: `(11) 3333${i.toString().padStart(4, '0')}`,
        address: 'Av. Industrial, 1000',
      },
    });
  }

  // Categorias
  const categories = [];
  const categoryNames = ['Motor', 'Freios', 'Suspensão', 'Elétrica', 'Transmissão'];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        clientId: autopecasClient.id,
        name: name,
        description: `Peças de ${name}`,
      },
    });
    categories.push(category);
  }

  // Produtos
  for (let i = 1; i <= 20; i++) {
    await prisma.product.create({
      data: {
        clientId: autopecasClient.id,
        categoryId: categories[(i - 1) % categories.length].id,
        name: `Produto ${i}`,
        price: 25.9 + i * 10,
        stock: 50 + i * 5,
        minStock: 10,
        sku: `PROD${i.toString().padStart(3, '0')}`,
        description: `Descrição do produto ${i}`,
        image: 'https://via.placeholder.com/200x200',
      },
    });
  }

  console.log('✅ Dados da AutoPeças criados - 20 produtos, 5 categorias, 5 fornecedores');

  console.log('\n🌱 Seed EXTENSO concluído com sucesso!');
  console.log('\n📋 Resumo dos dados criados:');
  console.log('🏢 IMOBILIÁRIA PRIME: 10 imóveis, 5 funcionários, 5 leads');
  console.log('🏥 CLÍNICA SÃO PAULO: 3 médicos, 10 pacientes, 6 consultas');
  console.log('🔧 AUTOPEÇAS CENTRAL: 20 produtos, 5 categorias, 5 fornecedores');

  console.log('\n🔑 Credenciais de acesso:');
  console.log('Super Admin: admin@moneymaker.dev - Senha: Admin123!@#');
  console.log('Imobiliária: admin@imobiliariaprime.com.br - Senha: Admin123!@#');
  console.log('Clínica: admin@clinicasp.com.br - Senha: Admin123!@#');
  console.log('AutoPeças: admin@autopecascentral.com.br - Senha: Admin123!@#');

  console.log('\n🚀 Sistema pronto para teste completo!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
