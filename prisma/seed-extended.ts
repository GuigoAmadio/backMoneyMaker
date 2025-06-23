import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function deleteAll() {
  console.log('🗑️ Limpando banco de dados...');

  // Deletar dados relacionados primeiro (ordem de dependência)
  await prisma.doctorAppointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.propertyLead.deleteMany();
  await prisma.propertyVisit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  console.log('✅ Dados deletados');
}

async function main() {
  console.log('🌱 Iniciando seed EXTENSO do banco de dados...');

  // Limpar dados existentes (cuidado em produção!)
  console.log('🧹 Limpando dados existentes...');
  await deleteAll();

  // Criar os 3 clientes
  const imobiliariaClient = await prisma.client.create({
    data: {
      id: 'clnt_imobiliaria_prime',
      name: 'Imobiliária Prime',
      slug: 'imobiliaria-prime',
      email: 'contato@imobiliariaprime.com.br',
      phone: '(11) 3333-1111',
      website: 'https://imobiliariaprime.com.br',
      status: 'ACTIVE',
      plan: 'premium',
      settings: JSON.stringify({
        type: 'imobiliaria',
        theme: 'green',
        features: ['properties', 'leads', 'visits'],
      }),
    },
  });

  const clinicaClient = await prisma.client.create({
    data: {
      id: 'clnt_clinica_sao_paulo',
      name: 'Clínica São Paulo',
      slug: 'clinica-sao-paulo',
      email: 'contato@clinicasp.com.br',
      phone: '(11) 3333-2222',
      website: 'https://clinicasp.com.br',
      status: 'ACTIVE',
      plan: 'premium',
      settings: JSON.stringify({
        type: 'clinica',
        theme: 'blue',
        features: ['appointments', 'patients', 'doctors'],
      }),
    },
  });

  const autopecasClient = await prisma.client.create({
    data: {
      id: 'clnt_autopecas_central',
      name: 'AutoPeças Central',
      slug: 'autopecas-central',
      email: 'contato@autopecascentral.com.br',
      phone: '(11) 3333-3333',
      website: 'https://autopecascentral.com.br',
      status: 'ACTIVE',
      plan: 'basic',
      settings: JSON.stringify({
        type: 'autopecas',
        theme: 'red',
        features: ['products', 'inventory', 'suppliers'],
      }),
    },
  });

  console.log('✅ Clientes criados');

  // Criar usuários admin
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);

  // Super Admin
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

  // Admins das empresas
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

  // DADOS EXTENSOS PARA IMOBILIÁRIA
  console.log('🏠 Criando dados da Imobiliária...');

  // Funcionários
  const funcionariosImob = [
    {
      name: 'Carlos Silva',
      email: 'carlos@imobiliariaprime.com.br',
      position: 'Corretor Senior',
      phone: '(11) 99999-0001',
    },
    {
      name: 'Ana Costa',
      email: 'ana@imobiliariaprime.com.br',
      position: 'Corretora',
      phone: '(11) 99999-0002',
    },
    {
      name: 'Roberto Lima',
      email: 'roberto@imobiliariaprime.com.br',
      position: 'Corretor',
      phone: '(11) 99999-0003',
    },
  ];

  for (const func of funcionariosImob) {
    await prisma.employee.create({
      data: {
        clientId: imobiliariaClient.id,
        ...func,
        workingHours: { monday: '08:00-18:00', tuesday: '08:00-18:00' },
      },
    });
  }

  // Imóveis
  const imoveis = [
    {
      title: 'Apartamento Luxo',
      type: 'APARTMENT',
      price: 850000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      neighborhood: 'Jardins',
    },
    {
      title: 'Casa Térrea',
      type: 'HOUSE',
      price: 650000,
      area: 180,
      bedrooms: 4,
      bathrooms: 3,
      address: 'Rua Verde, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890',
      neighborhood: 'Vila Madalena',
    },
  ];

  const imoveisCreated = [];
  for (const imovel of imoveis) {
    const created = await prisma.property.create({
      data: {
        clientId: imobiliariaClient.id,
        title: imovel.title,
        type: imovel.type as any,
        price: imovel.price,
        area: imovel.area,
        bedrooms: imovel.bedrooms,
        bathrooms: imovel.bathrooms,
        address: imovel.address,
        city: imovel.city,
        state: imovel.state,
        zipCode: imovel.zipCode,
        neighborhood: imovel.neighborhood,
        images: ['https://via.placeholder.com/400x300'],
        amenities: ['Piscina', 'Academia'],
        features: ['Ar Condicionado'],
      },
    });
    imoveisCreated.push(created);
  }

  // Leads
  const leads = [
    {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 98888-1111',
      message: 'Interessado no apartamento',
      source: 'site',
      status: 'NEW',
      priority: 'HIGH',
    },
    {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(11) 98888-2222',
      message: 'Gostaria de visitar',
      source: 'whatsapp',
      status: 'CONTACTED',
      priority: 'MEDIUM',
    },
  ];

  for (let i = 0; i < leads.length; i++) {
    await prisma.propertyLead.create({
      data: {
        clientId: imobiliariaClient.id,
        propertyId: imoveisCreated[i].id,
        name: leads[i].name,
        email: leads[i].email,
        phone: leads[i].phone,
        message: leads[i].message,
        source: leads[i].source,
        status: leads[i].status as any,
        priority: leads[i].priority as any,
      },
    });
  }

  console.log('✅ Dados da Imobiliária criados');

  // DADOS EXTENSOS PARA CLÍNICA
  console.log('🏥 Criando dados da Clínica...');

  // Funcionários médicos
  const funcionariosClinica = [
    {
      name: 'Dr. Ricardo Medeiros',
      email: 'ricardo@clinicasp.com.br',
      position: 'Cardiologista',
      phone: '(11) 99999-1001',
    },
    {
      name: 'Dra. Patricia Alves',
      email: 'patricia@clinicasp.com.br',
      position: 'Dermatologista',
      phone: '(11) 99999-1002',
    },
    {
      name: 'Dr. Marcos Pereira',
      email: 'marcos@clinicasp.com.br',
      position: 'Ortopedista',
      phone: '(11) 99999-1003',
    },
  ];

  const funcionariosClinicaCreated = [];
  for (const func of funcionariosClinica) {
    const created = await prisma.employee.create({
      data: {
        clientId: clinicaClient.id,
        ...func,
        workingHours: { monday: '07:00-17:00', tuesday: '07:00-17:00' },
      },
    });
    funcionariosClinicaCreated.push(created);
  }

  // Médicos
  const medicos = [
    {
      employeeId: funcionariosClinicaCreated[0].id,
      crm: '123456-SP',
      specialty: 'Cardiologia',
      consultationPrice: 350.0,
    },
    {
      employeeId: funcionariosClinicaCreated[1].id,
      crm: '234567-SP',
      specialty: 'Dermatologia',
      consultationPrice: 280.0,
    },
    {
      employeeId: funcionariosClinicaCreated[2].id,
      crm: '345678-SP',
      specialty: 'Ortopedia',
      consultationPrice: 320.0,
    },
  ];

  const medicosCreated = [];
  for (const medico of medicos) {
    const created = await prisma.doctor.create({
      data: {
        clientId: clinicaClient.id,
        ...medico,
        schedule: { monday: '08:00-16:00', tuesday: '08:00-16:00' },
      },
    });
    medicosCreated.push(created);
  }

  // Pacientes
  const pacientes = [
    {
      name: 'José Silva',
      phone: '(11) 98888-0001',
      email: 'jose@email.com',
      document: '12345678901',
      birthDate: new Date('1980-05-15'),
      gender: 'MALE',
    },
    {
      name: 'Maria Santos',
      phone: '(11) 98888-0002',
      email: 'maria@email.com',
      document: '23456789012',
      birthDate: new Date('1975-08-22'),
      gender: 'FEMALE',
    },
    {
      name: 'Pedro Costa',
      phone: '(11) 98888-0003',
      email: 'pedro@email.com',
      document: '34567890123',
      birthDate: new Date('1990-12-10'),
      gender: 'MALE',
    },
  ];

  const pacientesCreated = [];
  for (const paciente of pacientes) {
    const created = await prisma.patient.create({
      data: {
        clientId: clinicaClient.id,
        name: paciente.name,
        phone: paciente.phone,
        email: paciente.email,
        document: paciente.document,
        birthDate: paciente.birthDate,
        gender: paciente.gender as any,
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      },
    });
    pacientesCreated.push(created);
  }

  // Consultas
  const consultas = [
    {
      doctorId: medicosCreated[0].id,
      patientId: pacientesCreated[0].id,
      scheduledAt: new Date('2024-06-25T09:00:00'),
      price: 350.0,
      symptoms: 'Dor no peito',
      status: 'SCHEDULED',
    },
    {
      doctorId: medicosCreated[1].id,
      patientId: pacientesCreated[1].id,
      scheduledAt: new Date('2024-06-25T10:00:00'),
      price: 280.0,
      symptoms: 'Manchas na pele',
      status: 'CONFIRMED',
    },
  ];

  for (const consulta of consultas) {
    await prisma.doctorAppointment.create({
      data: {
        clientId: clinicaClient.id,
        doctorId: consulta.doctorId,
        patientId: consulta.patientId,
        scheduledAt: consulta.scheduledAt,
        price: consulta.price,
        symptoms: consulta.symptoms,
        status: consulta.status as any,
      },
    });
  }

  console.log('✅ Dados da Clínica criados');

  // DADOS EXTENSOS PARA AUTOPEÇAS
  console.log('🔧 Criando dados da AutoPeças...');

  // Funcionários
  const funcionariosAutopecas = [
    {
      name: 'Carlos Vendedor',
      email: 'carlos@autopecascentral.com.br',
      position: 'Vendedor',
      phone: '(11) 99999-2001',
    },
    {
      name: 'Ana Estoquista',
      email: 'ana@autopecascentral.com.br',
      position: 'Estoquista',
      phone: '(11) 99999-2002',
    },
  ];

  for (const func of funcionariosAutopecas) {
    await prisma.employee.create({
      data: {
        clientId: autopecasClient.id,
        ...func,
        workingHours: { monday: '08:00-18:00', tuesday: '08:00-18:00' },
      },
    });
  }

  // Fornecedores
  const fornecedores = [
    {
      name: 'Bosch do Brasil',
      document: '12345678000100',
      email: 'vendas@bosch.com.br',
      phone: '(11) 3333-1111',
    },
    {
      name: 'Continental',
      document: '23456789000200',
      email: 'comercial@continental.com.br',
      phone: '(11) 3333-2222',
    },
  ];

  for (const fornecedor of fornecedores) {
    await prisma.supplier.create({
      data: {
        clientId: autopecasClient.id,
        ...fornecedor,
        address: 'Av. Industrial, 1000',
      },
    });
  }

  // Categorias
  const categorias = [
    { name: 'Motor', description: 'Peças do motor' },
    { name: 'Freios', description: 'Sistema de freios' },
    { name: 'Suspensão', description: 'Sistema de suspensão' },
  ];

  const categoriasCreated = [];
  for (const categoria of categorias) {
    const created = await prisma.category.create({
      data: {
        clientId: autopecasClient.id,
        ...categoria,
      },
    });
    categoriasCreated.push(created);
  }

  // Produtos
  const produtos = [
    {
      name: 'Vela de Ignição NGK',
      price: 25.9,
      stock: 150,
      minStock: 20,
      sku: 'VEL001',
      categoryId: categoriasCreated[0].id,
    },
    {
      name: 'Pastilha de Freio Bosch',
      price: 65.9,
      stock: 120,
      minStock: 20,
      sku: 'PAS001',
      categoryId: categoriasCreated[1].id,
    },
    {
      name: 'Amortecedor Dianteiro',
      price: 220.0,
      stock: 40,
      minStock: 8,
      sku: 'AMO001',
      categoryId: categoriasCreated[2].id,
    },
    {
      name: 'Filtro de Óleo',
      price: 18.5,
      stock: 80,
      minStock: 15,
      sku: 'FIL001',
      categoryId: categoriasCreated[0].id,
    },
    {
      name: 'Disco de Freio',
      price: 95.0,
      stock: 60,
      minStock: 10,
      sku: 'DIS001',
      categoryId: categoriasCreated[1].id,
    },
  ];

  for (const produto of produtos) {
    await prisma.product.create({
      data: {
        clientId: autopecasClient.id,
        ...produto,
        description: `Peça de qualidade: ${produto.name}`,
        image: 'https://via.placeholder.com/200x200',
      },
    });
  }

  console.log('✅ Dados da AutoPeças criados');

  console.log('\n🌱 Seed EXTENSO concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log('- 3 Clientes com dados extensos');
  console.log('- Imobiliária: 3 imóveis, 3 funcionários, 2 leads');
  console.log('- Clínica: 3 médicos, 3 pacientes, 2 consultas');
  console.log('- AutoPeças: 5 produtos, 3 categorias, 2 fornecedores');

  console.log('\n🔑 Credenciais:');
  console.log('Super Admin: admin@moneymaker.dev - Senha: Admin123!@#');
  console.log('Imobiliária: admin@imobiliariaprime.com.br - Senha: Admin123!@#');
  console.log('Clínica: admin@clinicasp.com.br - Senha: Admin123!@#');
  console.log('AutoPeças: admin@autopecascentral.com.br - Senha: Admin123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
