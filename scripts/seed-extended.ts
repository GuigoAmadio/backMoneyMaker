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
    {
      name: 'Mariana Santos',
      email: 'mariana@imobiliariaprime.com.br',
      position: 'Gerente de Vendas',
      phone: '(11) 99999-0004',
    },
    {
      name: 'Pedro Oliveira',
      email: 'pedro@imobiliariaprime.com.br',
      position: 'Corretor Junior',
      phone: '(11) 99999-0005',
    },
  ];

  for (const func of funcionariosImob) {
    await prisma.employee.create({
      data: {
        clientId: imobiliariaClient.id,
        name: func.name,
        email: func.email,
        position: func.position,
        phone: func.phone,
        workingHours: {
          monday: '08:00-18:00',
          tuesday: '08:00-18:00',
          wednesday: '08:00-18:00',
          thursday: '08:00-18:00',
          friday: '08:00-18:00',
        },
      },
    });
  }

  // Imóveis
  const imoveis = [
    {
      title: 'Apartamento Vila Olimpia',
      type: 'APARTMENT',
      price: 1200000,
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      address: 'Rua Funchal, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04551-060',
      neighborhood: 'Vila Olímpia',
    },
    {
      title: 'Casa Alphaville',
      type: 'HOUSE',
      price: 2500000,
      area: 350,
      bedrooms: 4,
      bathrooms: 4,
      parkingSpots: 4,
      address: 'Alameda dos Maracatins, 100',
      city: 'Barueri',
      state: 'SP',
      zipCode: '06454-030',
      neighborhood: 'Alphaville',
    },
    {
      title: 'Cobertura Jardins',
      type: 'APARTMENT',
      price: 3800000,
      area: 280,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpots: 3,
      address: 'Rua Augusta, 2000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01412-100',
      neighborhood: 'Jardins',
    },
    {
      title: 'Apartamento Brooklin',
      type: 'APARTMENT',
      price: 850000,
      area: 85,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpots: 1,
      address: 'Av. Berrini, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04571-010',
      neighborhood: 'Brooklin',
    },
    {
      title: 'Casa Morumbi',
      type: 'HOUSE',
      price: 1800000,
      area: 220,
      bedrooms: 3,
      bathrooms: 3,
      parkingSpots: 2,
      address: 'Rua Giovanni Gronchi, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05724-002',
      neighborhood: 'Morumbi',
    },
    {
      title: 'Loft Vila Madalena',
      type: 'APARTMENT',
      price: 680000,
      area: 60,
      bedrooms: 1,
      bathrooms: 1,
      parkingSpots: 1,
      address: 'Rua Harmonia, 200',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-000',
      neighborhood: 'Vila Madalena',
    },
    {
      title: 'Apartamento Higienópolis',
      type: 'APARTMENT',
      price: 950000,
      area: 95,
      bedrooms: 2,
      bathrooms: 2,
      address: 'Av. Higienópolis, 800',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01238-000',
      neighborhood: 'Higienópolis',
    },
    {
      title: 'Casa Granja Viana',
      type: 'HOUSE',
      price: 1600000,
      area: 280,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpots: 3,
      address: 'Estrada do Capuava, 1500',
      city: 'Cotia',
      state: 'SP',
      zipCode: '06709-015',
      neighborhood: 'Granja Viana',
    },
    {
      title: 'Penthouse Itaim',
      type: 'APARTMENT',
      price: 4200000,
      area: 320,
      bedrooms: 5,
      bathrooms: 4,
      parkingSpots: 4,
      address: 'Av. Faria Lima, 3000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04538-132',
      neighborhood: 'Itaim Bibi',
    },
    {
      title: 'Apartamento Perdizes',
      type: 'APARTMENT',
      price: 720000,
      area: 75,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpots: 1,
      address: 'Rua Cardoso de Almeida, 1200',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05013-001',
      neighborhood: 'Perdizes',
    },
  ];

  const imoveisCreated = [];
  for (const imovel of imoveis) {
    const created = await prisma.property.create({
      data: {
        clientId: imobiliariaClient.id,
        title: imovel.title,
        type: imovel.type,
        price: imovel.price,
        area: imovel.area,
        bedrooms: imovel.bedrooms,
        bathrooms: imovel.bathrooms,
        parkingSpots: imovel.parkingSpots || null,
        address: imovel.address,
        city: imovel.city,
        state: imovel.state,
        zipCode: imovel.zipCode,
        neighborhood: imovel.neighborhood,
        images: ['https://via.placeholder.com/400x300'],
        amenities: ['Piscina', 'Academia', 'Salão de Festas'],
        features: ['Ar Condicionado', 'Armários Planejados'],
      },
    });
    imoveisCreated.push(created);
  }

  // Leads para imóveis
  const leads = [
    {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 98888-1111',
      message: 'Interessado no apartamento da Vila Olímpia',
      source: 'site',
      status: 'NEW',
      priority: 'HIGH',
    },
    {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(11) 98888-2222',
      message: 'Gostaria de visitar a casa em Alphaville',
      source: 'whatsapp',
      status: 'CONTACTED',
      priority: 'MEDIUM',
    },
    {
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      phone: '(11) 98888-3333',
      message: 'Tenho interesse na cobertura dos Jardins',
      source: 'telefone',
      status: 'QUALIFIED',
      priority: 'HIGH',
    },
    {
      name: 'Ana Oliveira',
      email: 'ana@email.com',
      phone: '(11) 98888-4444',
      message: 'Procuro apartamento no Brooklin',
      source: 'site',
      status: 'NEW',
      priority: 'MEDIUM',
    },
    {
      name: 'Carlos Lima',
      email: 'carlos@email.com',
      phone: '(11) 98888-5555',
      message: 'Interessado em casa no Morumbi',
      source: 'indicação',
      status: 'PROPOSAL_SENT',
      priority: 'HIGH',
    },
  ];

  for (let i = 0; i < leads.length; i++) {
    await prisma.propertyLead.create({
      data: {
        clientId: imobiliariaClient.id,
        propertyId: imoveisCreated[i % imoveisCreated.length].id,
        name: leads[i].name,
        email: leads[i].email,
        phone: leads[i].phone,
        message: leads[i].message,
        source: leads[i].source,
        status: leads[i].status,
        priority: leads[i].priority,
      },
    });
  }

  // Visitas agendadas
  const visits = [
    {
      visitorName: 'Roberto Silva',
      visitorEmail: 'roberto@email.com',
      visitorPhone: '(11) 97777-1111',
      scheduledAt: new Date('2024-06-25T10:00:00'),
      status: 'SCHEDULED',
    },
    {
      visitorName: 'Lucia Mendes',
      visitorEmail: 'lucia@email.com',
      visitorPhone: '(11) 97777-2222',
      scheduledAt: new Date('2024-06-25T14:00:00'),
      status: 'CONFIRMED',
    },
    {
      visitorName: 'Fernando Costa',
      visitorEmail: 'fernando@email.com',
      visitorPhone: '(11) 97777-3333',
      scheduledAt: new Date('2024-06-26T09:00:00'),
      status: 'SCHEDULED',
    },
  ];

  for (let i = 0; i < visits.length; i++) {
    await prisma.propertyVisit.create({
      data: {
        clientId: imobiliariaClient.id,
        propertyId: imoveisCreated[i % imoveisCreated.length].id,
        visitorName: visits[i].visitorName,
        visitorEmail: visits[i].visitorEmail,
        visitorPhone: visits[i].visitorPhone,
        scheduledAt: visits[i].scheduledAt,
        status: visits[i].status,
      },
    });
  }

  console.log('✅ Dados da Imobiliária criados - 10 imóveis, 5 funcionários, 5 leads, 3 visitas');

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
    {
      name: 'Dra. Fernanda Lima',
      email: 'fernanda@clinicasp.com.br',
      position: 'Ginecologista',
      phone: '(11) 99999-1004',
    },
    {
      name: 'Dr. João Rodrigues',
      email: 'joao@clinicasp.com.br',
      position: 'Clínico Geral',
      phone: '(11) 99999-1005',
    },
    {
      name: 'Enfermeira Sandra',
      email: 'sandra@clinicasp.com.br',
      position: 'Enfermeira Chefe',
      phone: '(11) 99999-1006',
    },
    {
      name: 'Recepcionista Carla',
      email: 'carla@clinicasp.com.br',
      position: 'Recepcionista',
      phone: '(11) 99999-1007',
    },
  ];

  const funcionariosClinicaCreated = [];
  for (const func of funcionariosClinica) {
    const created = await prisma.employee.create({
      data: {
        clientId: clinicaClient.id,
        name: func.name,
        email: func.email,
        position: func.position,
        phone: func.phone,
        workingHours: {
          monday: '07:00-17:00',
          tuesday: '07:00-17:00',
          wednesday: '07:00-17:00',
          thursday: '07:00-17:00',
          friday: '07:00-17:00',
        },
      },
    });
    funcionariosClinicaCreated.push(created);
  }

  // Médicos (baseado nos primeiros 5 funcionários)
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
    {
      employeeId: funcionariosClinicaCreated[3].id,
      crm: '456789-SP',
      specialty: 'Ginecologia',
      consultationPrice: 300.0,
    },
    {
      employeeId: funcionariosClinicaCreated[4].id,
      crm: '567890-SP',
      specialty: 'Clínica Geral',
      consultationPrice: 200.0,
    },
  ];

  const medicosCreated = [];
  for (const medico of medicos) {
    const created = await prisma.doctor.create({
      data: {
        clientId: clinicaClient.id,
        employeeId: medico.employeeId,
        crm: medico.crm,
        specialty: medico.specialty,
        consultationPrice: medico.consultationPrice,
        schedule: {
          monday: '08:00-16:00',
          tuesday: '08:00-16:00',
          wednesday: '08:00-16:00',
          thursday: '08:00-16:00',
          friday: '08:00-16:00',
        },
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
    {
      name: 'Ana Oliveira',
      phone: '(11) 98888-0004',
      email: 'ana@email.com',
      document: '45678901234',
      birthDate: new Date('1985-03-28'),
      gender: 'FEMALE',
    },
    {
      name: 'Carlos Lima',
      phone: '(11) 98888-0005',
      email: 'carlos@email.com',
      document: '56789012345',
      birthDate: new Date('1970-11-05'),
      gender: 'MALE',
    },
    {
      name: 'Lucia Mendes',
      phone: '(11) 98888-0006',
      email: 'lucia@email.com',
      document: '67890123456',
      birthDate: new Date('1988-07-12'),
      gender: 'FEMALE',
    },
    {
      name: 'Roberto Alves',
      phone: '(11) 98888-0007',
      email: 'roberto@email.com',
      document: '78901234567',
      birthDate: new Date('1965-02-20'),
      gender: 'MALE',
    },
    {
      name: 'Fernanda Costa',
      phone: '(11) 98888-0008',
      email: 'fernanda@email.com',
      document: '89012345678',
      birthDate: new Date('1992-09-18'),
      gender: 'FEMALE',
    },
    {
      name: 'Paulo Santos',
      phone: '(11) 98888-0009',
      email: 'paulo@email.com',
      document: '90123456789',
      birthDate: new Date('1978-04-30'),
      gender: 'MALE',
    },
    {
      name: 'Juliana Lima',
      phone: '(11) 98888-0010',
      email: 'juliana@email.com',
      document: '01234567890',
      birthDate: new Date('1995-11-25'),
      gender: 'FEMALE',
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
        gender: paciente.gender,
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      },
    });
    pacientesCreated.push(created);
  }

  // Consultas agendadas
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
    {
      doctorId: medicosCreated[2].id,
      patientId: pacientesCreated[2].id,
      scheduledAt: new Date('2024-06-25T11:00:00'),
      price: 320.0,
      symptoms: 'Dor no joelho',
      status: 'SCHEDULED',
    },
    {
      doctorId: medicosCreated[3].id,
      patientId: pacientesCreated[3].id,
      scheduledAt: new Date('2024-06-25T14:00:00'),
      price: 300.0,
      symptoms: 'Consulta de rotina',
      status: 'CONFIRMED',
    },
    {
      doctorId: medicosCreated[4].id,
      patientId: pacientesCreated[4].id,
      scheduledAt: new Date('2024-06-25T15:00:00'),
      price: 200.0,
      symptoms: 'Check-up geral',
      status: 'SCHEDULED',
    },
    {
      doctorId: medicosCreated[0].id,
      patientId: pacientesCreated[5].id,
      scheduledAt: new Date('2024-06-26T09:00:00'),
      price: 350.0,
      symptoms: 'Palpitações',
      status: 'SCHEDULED',
    },
    {
      doctorId: medicosCreated[1].id,
      patientId: pacientesCreated[6].id,
      scheduledAt: new Date('2024-06-26T10:00:00'),
      price: 280.0,
      symptoms: 'Acne',
      status: 'CONFIRMED',
    },
    {
      doctorId: medicosCreated[2].id,
      patientId: pacientesCreated[7].id,
      scheduledAt: new Date('2024-06-26T11:00:00'),
      price: 320.0,
      symptoms: 'Dor nas costas',
      status: 'SCHEDULED',
    },
    {
      doctorId: medicosCreated[3].id,
      patientId: pacientesCreated[8].id,
      scheduledAt: new Date('2024-06-26T14:00:00'),
      price: 300.0,
      symptoms: 'Exame preventivo',
      status: 'CONFIRMED',
    },
    {
      doctorId: medicosCreated[4].id,
      patientId: pacientesCreated[9].id,
      scheduledAt: new Date('2024-06-26T15:00:00'),
      price: 200.0,
      symptoms: 'Gripe',
      status: 'SCHEDULED',
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
        status: consulta.status,
      },
    });
  }

  console.log(
    '✅ Dados da Clínica criados - 5 médicos, 10 pacientes, 10 consultas, 7 funcionários',
  );

  // DADOS EXTENSOS PARA AUTOPEÇAS
  console.log('🔧 Criando dados da AutoPeças...');

  // Funcionários
  const funcionariosAutopecas = [
    {
      name: 'Carlos Vendedor',
      email: 'carlos@autopecascentral.com.br',
      position: 'Vendedor Senior',
      phone: '(11) 99999-2001',
    },
    {
      name: 'Ana Estoquista',
      email: 'ana@autopecascentral.com.br',
      position: 'Estoquista',
      phone: '(11) 99999-2002',
    },
    {
      name: 'Roberto Gerente',
      email: 'roberto@autopecascentral.com.br',
      position: 'Gerente de Vendas',
      phone: '(11) 99999-2003',
    },
    {
      name: 'Mariana Compras',
      email: 'mariana@autopecascentral.com.br',
      position: 'Compradora',
      phone: '(11) 99999-2004',
    },
    {
      name: 'Pedro Técnico',
      email: 'pedro@autopecascentral.com.br',
      position: 'Técnico em Peças',
      phone: '(11) 99999-2005',
    },
  ];

  for (const func of funcionariosAutopecas) {
    await prisma.employee.create({
      data: {
        clientId: autopecasClient.id,
        name: func.name,
        email: func.email,
        position: func.position,
        phone: func.phone,
        workingHours: {
          monday: '08:00-18:00',
          tuesday: '08:00-18:00',
          wednesday: '08:00-18:00',
          thursday: '08:00-18:00',
          friday: '08:00-18:00',
          saturday: '08:00-12:00',
        },
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
      name: 'Continental Automotive',
      document: '23456789000200',
      email: 'comercial@continental.com.br',
      phone: '(11) 3333-2222',
    },
    {
      name: 'Magneti Marelli',
      document: '34567890000300',
      email: 'vendas@magnetimarelli.com.br',
      phone: '(11) 3333-3333',
    },
    {
      name: 'NGK do Brasil',
      document: '45678901000400',
      email: 'comercial@ngk.com.br',
      phone: '(11) 3333-4444',
    },
    {
      name: 'Valeo Sistemas',
      document: '56789012000500',
      email: 'vendas@valeo.com.br',
      phone: '(11) 3333-5555',
    },
  ];

  for (const fornecedor of fornecedores) {
    await prisma.supplier.create({
      data: {
        clientId: autopecasClient.id,
        name: fornecedor.name,
        document: fornecedor.document,
        email: fornecedor.email,
        phone: fornecedor.phone,
        address: 'Av. Industrial, 1000 - São Paulo/SP',
      },
    });
  }

  // Categorias
  const categorias = [
    { name: 'Motor', description: 'Peças do motor' },
    { name: 'Freios', description: 'Sistema de freios' },
    { name: 'Suspensão', description: 'Sistema de suspensão' },
    { name: 'Elétrica', description: 'Sistema elétrico' },
    { name: 'Transmissão', description: 'Sistema de transmissão' },
    { name: 'Arrefecimento', description: 'Sistema de arrefecimento' },
    { name: 'Combustível', description: 'Sistema de combustível' },
    { name: 'Filtros', description: 'Filtros diversos' },
  ];

  const categoriasCreated = [];
  for (const categoria of categorias) {
    const created = await prisma.category.create({
      data: {
        clientId: autopecasClient.id,
        name: categoria.name,
        description: categoria.description,
      },
    });
    categoriasCreated.push(created);
  }

  // Produtos (muitos produtos para testar estoque)
  const produtos = [
    // Motor
    {
      name: 'Vela de Ignição NGK',
      price: 25.9,
      stock: 150,
      minStock: 20,
      sku: 'VEL001',
      categoryId: categoriasCreated[0].id,
    },
    {
      name: 'Correia Dentada Gates',
      price: 89.9,
      stock: 45,
      minStock: 10,
      sku: 'COR001',
      categoryId: categoriasCreated[0].id,
    },
    {
      name: 'Bomba de Óleo',
      price: 180.0,
      stock: 25,
      minStock: 5,
      sku: 'BOM001',
      categoryId: categoriasCreated[0].id,
    },

    // Freios
    {
      name: 'Pastilha de Freio Bosch',
      price: 65.9,
      stock: 120,
      minStock: 20,
      sku: 'PAS001',
      categoryId: categoriasCreated[1].id,
    },
    {
      name: 'Disco de Freio Ventilado',
      price: 95.0,
      stock: 60,
      minStock: 10,
      sku: 'DIS001',
      categoryId: categoriasCreated[1].id,
    },
    {
      name: 'Fluido de Freio DOT4',
      price: 12.9,
      stock: 200,
      minStock: 30,
      sku: 'FLU001',
      categoryId: categoriasCreated[1].id,
    },
    {
      name: 'Cilindro de Freio',
      price: 45.0,
      stock: 35,
      minStock: 8,
      sku: 'CIL001',
      categoryId: categoriasCreated[1].id,
    },

    // Suspensão
    {
      name: 'Amortecedor Dianteiro',
      price: 220.0,
      stock: 40,
      minStock: 8,
      sku: 'AMO001',
      categoryId: categoriasCreated[2].id,
    },
    {
      name: 'Mola Helicoidal',
      price: 85.0,
      stock: 30,
      minStock: 6,
      sku: 'MOL001',
      categoryId: categoriasCreated[2].id,
    },
    {
      name: 'Bieleta Estabilizadora',
      price: 35.9,
      stock: 55,
      minStock: 10,
      sku: 'BIE001',
      categoryId: categoriasCreated[2].id,
    },

    // Elétrica
    {
      name: 'Bateria 60Ah Moura',
      price: 280.0,
      stock: 25,
      minStock: 5,
      sku: 'BAT001',
      categoryId: categoriasCreated[3].id,
    },
    {
      name: 'Alternador Bosch',
      price: 450.0,
      stock: 15,
      minStock: 3,
      sku: 'ALT001',
      categoryId: categoriasCreated[3].id,
    },
    {
      name: 'Motor de Partida',
      price: 380.0,
      stock: 18,
      minStock: 4,
      sku: 'MOT001',
      categoryId: categoriasCreated[3].id,
    },
    {
      name: 'Cabo de Vela',
      price: 45.9,
      stock: 75,
      minStock: 15,
      sku: 'CAB001',
      categoryId: categoriasCreated[3].id,
    },

    // Transmissão
    {
      name: 'Kit Embreagem',
      price: 320.0,
      stock: 20,
      minStock: 4,
      sku: 'KIT001',
      categoryId: categoriasCreated[4].id,
    },
    {
      name: 'Óleo Cambio SAE 80W90',
      price: 28.9,
      stock: 100,
      minStock: 20,
      sku: 'OLE001',
      categoryId: categoriasCreated[4].id,
    },
    {
      name: 'Junta Homocinética',
      price: 180.0,
      stock: 30,
      minStock: 6,
      sku: 'JUN001',
      categoryId: categoriasCreated[4].id,
    },

    // Arrefecimento
    {
      name: 'Radiador de Água',
      price: 250.0,
      stock: 22,
      minStock: 5,
      sku: 'RAD001',
      categoryId: categoriasCreated[5].id,
    },
    {
      name: 'Bomba de Água',
      price: 120.0,
      stock: 35,
      minStock: 8,
      sku: 'BOM002',
      categoryId: categoriasCreated[5].id,
    },
    {
      name: 'Válvula Termostática',
      price: 35.0,
      stock: 60,
      minStock: 12,
      sku: 'VAL001',
      categoryId: categoriasCreated[5].id,
    },
    {
      name: 'Aditivo Radiador',
      price: 15.9,
      stock: 150,
      minStock: 25,
      sku: 'ADI001',
      categoryId: categoriasCreated[5].id,
    },

    // Combustível
    {
      name: 'Filtro de Combustível',
      price: 22.9,
      stock: 90,
      minStock: 18,
      sku: 'FIL002',
      categoryId: categoriasCreated[6].id,
    },
    {
      name: 'Bomba de Combustível',
      price: 280.0,
      stock: 20,
      minStock: 4,
      sku: 'BOM003',
      categoryId: categoriasCreated[6].id,
    },
    {
      name: 'Bico Injetor',
      price: 150.0,
      stock: 40,
      minStock: 8,
      sku: 'BIC001',
      categoryId: categoriasCreated[6].id,
    },

    // Filtros
    {
      name: 'Filtro de Óleo Bosch',
      price: 18.5,
      stock: 80,
      minStock: 15,
      sku: 'FIL001',
      categoryId: categoriasCreated[7].id,
    },
    {
      name: 'Filtro de Ar',
      price: 28.9,
      stock: 120,
      minStock: 25,
      sku: 'FIL003',
      categoryId: categoriasCreated[7].id,
    },
    {
      name: 'Filtro de Cabine',
      price: 35.9,
      stock: 80,
      minStock: 15,
      sku: 'FIL004',
      categoryId: categoriasCreated[7].id,
    },
    {
      name: 'Filtro Separador Água',
      price: 45.0,
      stock: 50,
      minStock: 10,
      sku: 'FIL005',
      categoryId: categoriasCreated[7].id,
    },
  ];

  for (const produto of produtos) {
    await prisma.product.create({
      data: {
        clientId: autopecasClient.id,
        categoryId: produto.categoryId,
        name: produto.name,
        price: produto.price,
        stock: produto.stock,
        minStock: produto.minStock,
        sku: produto.sku,
        description: `Peça de alta qualidade: ${produto.name}`,
        image: 'https://via.placeholder.com/200x200',
      },
    });
  }

  console.log(
    '✅ Dados da AutoPeças criados - 27 produtos, 8 categorias, 5 fornecedores, 5 funcionários',
  );

  console.log('\n🌱 Seed EXTENSO concluído com sucesso!');
  console.log('\n📋 Resumo dos dados criados:');
  console.log('🏢 IMOBILIÁRIA PRIME:');
  console.log('  - 10 imóveis (apartamentos, casas, cobertura, loft, penthouse)');
  console.log('  - 5 funcionários (corretores e gerente)');
  console.log('  - 5 leads interessados');
  console.log('  - 3 visitas agendadas');

  console.log('\n🏥 CLÍNICA SÃO PAULO:');
  console.log(
    '  - 5 médicos especialistas (cardiologia, dermatologia, ortopedia, ginecologia, clínica geral)',
  );
  console.log('  - 10 pacientes cadastrados');
  console.log('  - 10 consultas agendadas');
  console.log('  - 7 funcionários (médicos, enfermeira, recepcionista)');

  console.log('\n🔧 AUTOPEÇAS CENTRAL:');
  console.log('  - 27 produtos distribuídos em 8 categorias');
  console.log('  - 5 fornecedores (Bosch, Continental, Magneti Marelli, NGK, Valeo)');
  console.log('  - 5 funcionários (vendedor, estoquista, gerente, comprador, técnico)');
  console.log('  - Controle de estoque com alertas de estoque mínimo');

  console.log('\n🔑 Credenciais de acesso:');
  console.log('Super Admin: admin@moneymaker.dev - Senha: Admin123!@#');
  console.log('Imobiliária Prime: admin@imobiliariaprime.com.br - Senha: Admin123!@#');
  console.log('Clínica São Paulo: admin@clinicasp.com.br - Senha: Admin123!@#');
  console.log('AutoPeças Central: admin@autopecascentral.com.br - Senha: Admin123!@#');

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
