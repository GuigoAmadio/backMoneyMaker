import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar cliente de exemplo
  const clientData = {
    id: 'clnt_01h3m5k8y7x9p2q3r4s5t6u7v8w9',
    name: 'MoneyMaker Demo',
    slug: 'demo',
    email: 'demo@moneymaker.dev',
    phone: '(11) 99999-9999',
    website: 'https://demo.moneymaker.dev',
    status: 'ACTIVE' as const,
    plan: 'basic',
    settings: JSON.stringify({
      theme: 'light',
      features: ['appointments', 'orders', 'products'],
      notifications: {
        email: true,
        sms: false,
      },
      branding: {
        primaryColor: '#3B82F6',
        logo: '/logo.png',
      },
    }),
  };

  const existingClient = await prisma.client.findUnique({
    where: { slug: clientData.slug },
  });

  let client;
  if (!existingClient) {
    client = await prisma.client.create({
      data: clientData,
    });
    console.log('✅ Cliente demo criado:', client.name);
  } else {
    client = existingClient;
    console.log('ℹ️  Cliente demo já existe:', client.name);
  }

  // Criar usuário super admin
  const superAdminPassword = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#',
    12
  );

  const superAdminData = {
    id: 'user_01h3m5k8y7x9p2q3r4s5t6u7v8w9',
    name: 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@moneymaker.dev',
    password: superAdminPassword,
    role: 'SUPER_ADMIN' as const,
    status: 'ACTIVE' as const,
    clientId: client.id,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  };

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      email: superAdminData.email,
      role: 'SUPER_ADMIN',
    },
  });

  if (!existingSuperAdmin) {
    const superAdmin = await prisma.user.create({
      data: superAdminData,
    });
    console.log('✅ Super Admin criado:', superAdmin.email);
  } else {
    console.log('ℹ️  Super Admin já existe:', existingSuperAdmin.email);
  }

  // Criar usuário admin do cliente demo
  const adminPassword = await bcrypt.hash('Demo123!@#', 12);

  const adminData = {
    name: 'Admin Demo',
    email: 'admin@demo.moneymaker.dev',
    password: adminPassword,
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    clientId: client.id,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  };

  const existingAdmin = await prisma.user.findFirst({
    where: { 
      email: adminData.email,
      clientId: client.id,
    },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: adminData,
    });
    console.log('✅ Admin demo criado:', admin.email);
  } else {
    console.log('ℹ️  Admin demo já existe:', existingAdmin.email);
  }

  // Criar funcionário de exemplo
  const employeeData = {
    name: 'João Silva',
    email: 'joao@demo.moneymaker.dev',
    phone: '(11) 98888-8888',
    position: 'Atendente',
    description: 'Atendente especializado em agendamentos',
    workingHours: JSON.stringify({
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '08:00', end: '14:00' },
      sunday: null,
    }),
    clientId: client.id,
  };

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      email: employeeData.email,
      clientId: client.id,
    },
  });

  let employee;
  if (!existingEmployee) {
    employee = await prisma.employee.create({
      data: employeeData,
    });
    console.log('✅ Funcionário criado:', employee.name);
  } else {
    employee = existingEmployee;
    console.log('ℹ️  Funcionário já existe:', employee.name);
  }

  // Criar serviços de exemplo
  const servicesData = [
    {
      name: 'Consulta Básica',
      description: 'Consulta de rotina de 30 minutos',
      duration: 30,
      price: 100.00,
      clientId: client.id,
    },
    {
      name: 'Consulta Especializada',
      description: 'Consulta especializada de 60 minutos',
      duration: 60,
      price: 200.00,
      clientId: client.id,
    },
  ];

  for (const serviceData of servicesData) {
    const existingService = await prisma.service.findFirst({
      where: {
        name: serviceData.name,
        clientId: client.id,
      },
    });

    if (!existingService) {
      const service = await prisma.service.create({
        data: serviceData,
      });
      console.log('✅ Serviço criado:', service.name);

      // Associar funcionário ao serviço
      await prisma.service.update({
        where: { id: service.id },
        data: {
          employees: {
            connect: { id: employee.id },
          },
        },
      });
    } else {
      console.log('ℹ️  Serviço já existe:', existingService.name);
    }
  }

  // Criar categoria de produtos
  const categoryData = {
    name: 'Produtos Gerais',
    description: 'Categoria geral para produtos diversos',
    clientId: client.id,
  };

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: categoryData.name,
      clientId: client.id,
    },
  });

  let category;
  if (!existingCategory) {
    category = await prisma.category.create({
      data: categoryData,
    });
    console.log('✅ Categoria criada:', category.name);
  } else {
    category = existingCategory;
    console.log('ℹ️  Categoria já existe:', category.name);
  }

  // Criar produtos de exemplo
  const productsData = [
    {
      name: 'Produto A',
      description: 'Descrição do produto A',
      price: 50.00,
      sku: 'PROD-A-001',
      stock: 100,
      minStock: 10,
      categoryId: category.id,
      clientId: client.id,
    },
    {
      name: 'Produto B',
      description: 'Descrição do produto B',
      price: 75.00,
      sku: 'PROD-B-001',
      stock: 50,
      minStock: 5,
      categoryId: category.id,
      clientId: client.id,
    },
  ];

  for (const productData of productsData) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: productData.sku,
        clientId: client.id,
      },
    });

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: productData,
      });
      console.log('✅ Produto criado:', product.name);
    } else {
      console.log('ℹ️  Produto já existe:', existingProduct.name);
    }
  }

  console.log('🌱 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Dados criados:');
  console.log(`- Cliente: ${client.name} (${client.slug})`);
  console.log(`- Super Admin: ${process.env.SUPER_ADMIN_EMAIL || 'admin@moneymaker.dev'}`);
  console.log('- Admin Demo: admin@demo.moneymaker.dev');
  console.log('- Funcionário: João Silva');
  console.log('- 2 Serviços');
  console.log('- 1 Categoria');
  console.log('- 2 Produtos');
  console.log('');
  console.log('🔑 Credenciais de teste:');
  console.log('Super Admin:');
  console.log(`Email: ${process.env.SUPER_ADMIN_EMAIL || 'admin@moneymaker.dev'}`);
  console.log(`Senha: ${process.env.SUPER_ADMIN_PASSWORD || 'Admin123!@#'}`);
  console.log('');
  console.log('Admin Demo:');
  console.log('Email: admin@demo.moneymaker.dev');
  console.log('Senha: Demo123!@#');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 