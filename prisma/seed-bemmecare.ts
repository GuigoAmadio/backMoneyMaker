import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do BemMeCare...');

  // ========================================
  // 1. CRIAR CLIENTE BEM MECARE
  // ========================================
  console.log('📋 Criando cliente BemMeCare...');

  const bemmecare = await prisma.client.upsert({
    where: { slug: 'bemmecare' },
    update: {},
    create: {
      name: 'BemMeCare',
      slug: 'bemmecare',
      email: 'contato@bemmecare.com',
      phone: '(11) 99999-9999',
      logo: 'https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=BemMeCare',
      website: 'https://bemmecare.com',
      status: 'ACTIVE',
      plan: 'premium',
      settings: {
        theme: 'blue',
        features: ['appointments', 'ecommerce', 'reports'],
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },
  });

  console.log('✅ Cliente BemMeCare criado:', bemmecare.id);

  // ========================================
  // 2. CRIAR USUÁRIOS
  // ========================================
  console.log('👥 Criando usuários...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  const admin = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: bemmecare.id,
        email: 'admin@bemmecare.com',
      },
    },
    update: {},
    create: {
      clientId: bemmecare.id,
      name: 'Administrador',
      email: 'admin@bemmecare.com',
      phone: '(11) 99999-9999',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const employee = await prisma.user.upsert({
    where: {
      clientId_email: {
        clientId: bemmecare.id,
        email: 'funcionario@bemmecare.com',
      },
    },
    update: {},
    create: {
      clientId: bemmecare.id,
      name: 'Funcionário',
      email: 'funcionario@bemmecare.com',
      phone: '(11) 88888-8888',
      password: employeePassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Usuários criados');

  // ========================================
  // 3. CRIAR CATEGORIAS
  // ========================================
  console.log('📂 Criando categorias...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        id: 'cat-saude-mental',
      },
      update: {},
      create: {
        id: 'cat-saude-mental',
        clientId: bemmecare.id,
        name: 'Saúde Mental',
        description: 'Serviços relacionados à saúde mental e bem-estar psicológico',
        color: '#4F46E5',
        type: 'service',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: {
        id: 'cat-terapia',
      },
      update: {},
      create: {
        id: 'cat-terapia',
        clientId: bemmecare.id,
        name: 'Terapia',
        description: 'Sessões de terapia individual e em grupo',
        color: '#10B981',
        type: 'service',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: {
        id: 'cat-produtos',
      },
      update: {},
      create: {
        id: 'cat-produtos',
        clientId: bemmecare.id,
        name: 'Produtos',
        description: 'Produtos para saúde mental e bem-estar',
        color: '#F59E0B',
        type: 'product',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Categorias criadas');

  // ========================================
  // 4. CRIAR FUNCIONÁRIOS
  // ========================================
  console.log('👨‍⚕️ Criando funcionários...');

  const employees = await Promise.all([
    prisma.employee.upsert({
      where: {
        clientId_email: {
          clientId: bemmecare.id,
          email: 'dr.silva@bemmecare.com',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        name: 'Dr. Carlos Silva',
        email: 'dr.silva@bemmecare.com',
        phone: '(11) 77777-7777',
        position: 'Psicólogo Clínico',
        description: 'Especialista em terapia cognitivo-comportamental',
        avatar: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=CS',
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
        },
        isActive: true,
      },
    }),
    prisma.employee.upsert({
      where: {
        clientId_email: {
          clientId: bemmecare.id,
          email: 'dra.santos@bemmecare.com',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        name: 'Dra. Ana Santos',
        email: 'dra.santos@bemmecare.com',
        phone: '(11) 66666-6666',
        position: 'Psicóloga',
        description: 'Especialista em terapia familiar',
        avatar: 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=AS',
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
        },
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Funcionários criados');

  // ========================================
  // 5. CRIAR SERVIÇOS
  // ========================================
  console.log('🩺 Criando serviços...');

  const services = await Promise.all([
    prisma.service.upsert({
      where: {
        id: 'serv-terapia-individual',
      },
      update: {},
      create: {
        id: 'serv-terapia-individual',
        clientId: bemmecare.id,
        categoryId: categories[1].id, // Terapia
        name: 'Terapia Individual',
        description: 'Sessão individual de terapia com psicólogo especializado',
        duration: 60, // 60 minutos
        price: 150.0,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: {
        id: 'serv-terapia-casal',
      },
      update: {},
      create: {
        id: 'serv-terapia-casal',
        clientId: bemmecare.id,
        categoryId: categories[1].id, // Terapia
        name: 'Terapia de Casal',
        description: 'Sessão de terapia para casais',
        duration: 90, // 90 minutos
        price: 200.0,
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: {
        id: 'serv-consulta-inicial',
      },
      update: {},
      create: {
        id: 'serv-consulta-inicial',
        clientId: bemmecare.id,
        categoryId: categories[0].id, // Saúde Mental
        name: 'Consulta Inicial',
        description: 'Primeira consulta para avaliação e planejamento',
        duration: 45, // 45 minutos
        price: 100.0,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Serviços criados');

  // ========================================
  // 6. CRIAR PRODUTOS
  // ========================================
  console.log('🛍️ Criando produtos...');

  const products = await Promise.all([
    prisma.product.upsert({
      where: {
        clientId_sku: {
          clientId: bemmecare.id,
          sku: 'LIVRO-ANSIEDADE-001',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        categoryId: categories[2].id, // Produtos
        name: 'Livro: Como Lidar com a Ansiedade',
        description: 'Guia prático para gerenciar ansiedade e estresse',
        price: 45.0,
        image: 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Livro+Ansiedade',
        images: [
          'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Livro+Ansiedade+1',
          'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Livro+Ansiedade+2',
        ],
        sku: 'LIVRO-ANSIEDADE-001',
        stock: 50,
        minStock: 5,
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: {
        clientId_sku: {
          clientId: bemmecare.id,
          sku: 'KIT-MEDITACAO-001',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        categoryId: categories[2].id, // Produtos
        name: 'Kit de Meditação',
        description: 'Kit completo para iniciar na prática da meditação',
        price: 89.9,
        image: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Kit+Meditação',
        images: [
          'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Kit+Meditação+1',
          'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Kit+Meditação+2',
        ],
        sku: 'KIT-MEDITACAO-001',
        stock: 30,
        minStock: 3,
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: {
        clientId_sku: {
          clientId: bemmecare.id,
          sku: 'JORNAL-EXPRESSIVO-001',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        categoryId: categories[2].id, // Produtos
        name: 'Jornal Expressivo',
        description: 'Caderno para escrita terapêutica e expressão emocional',
        price: 25.0,
        image: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Jornal+Expressivo',
        images: ['https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Jornal+Expressivo+1'],
        sku: 'JORNAL-EXPRESSIVO-001',
        stock: 100,
        minStock: 10,
        isActive: true,
        isFeatured: false,
      },
    }),
  ]);

  console.log('✅ Produtos criados');

  // ========================================
  // 7. CRIAR AGENDAMENTOS DE EXEMPLO
  // ========================================
  console.log('📅 Criando agendamentos de exemplo...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const appointments = await Promise.all([
    prisma.appointment.upsert({
      where: {
        id: 'app-001',
      },
      update: {},
      create: {
        id: 'app-001',
        clientId: bemmecare.id,
        userId: admin.id,
        employeeId: employees[0].id, // Dr. Carlos Silva
        serviceId: services[0].id, // Terapia Individual
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // +1 hora
        status: 'SCHEDULED',
        notes: 'Primeira sessão de terapia individual',
      },
    }),
    prisma.appointment.upsert({
      where: {
        id: 'app-002',
      },
      update: {},
      create: {
        id: 'app-002',
        clientId: bemmecare.id,
        userId: employee.id,
        employeeId: employees[1].id, // Dra. Ana Santos
        serviceId: services[1].id, // Terapia de Casal
        startTime: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        endTime: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // +90 min
        status: 'SCHEDULED',
        notes: 'Sessão de terapia de casal',
      },
    }),
  ]);

  console.log('✅ Agendamentos criados');

  // ========================================
  // 8. CRIAR PEDIDOS DE EXEMPLO
  // ========================================
  console.log('🛒 Criando pedidos de exemplo...');

  const order = await prisma.order.upsert({
    where: {
      orderNumber: 'BMC-2024-001',
    },
    update: {},
    create: {
      clientId: bemmecare.id,
      userId: admin.id,
      orderNumber: 'BMC-2024-001',
      status: 'CONFIRMED',
      total: 134.9,
      deliveryAddress: 'Rua das Flores, 123 - São Paulo, SP',
      deliveryFee: 10.0,
      paymentStatus: 'PAID',
      paymentMethod: 'PIX',
    },
  });

  // Criar itens do pedido
  await Promise.all([
    prisma.orderItem.upsert({
      where: {
        id: 'item-001',
      },
      update: {},
      create: {
        id: 'item-001',
        orderId: order.id,
        productId: products[0].id, // Livro Ansiedade
        quantity: 1,
        price: 45.0,
        subtotal: 45.0,
        totalPrice: 45.0,
      },
    }),
    prisma.orderItem.upsert({
      where: {
        id: 'item-002',
      },
      update: {},
      create: {
        id: 'item-002',
        orderId: order.id,
        productId: products[1].id, // Kit Meditação
        quantity: 1,
        price: 89.9,
        subtotal: 89.9,
        totalPrice: 89.9,
      },
    }),
  ]);

  console.log('✅ Pedidos criados');

  // ========================================
  // 9. CRIAR CLIENTES DO ECOMMERCE
  // ========================================
  console.log('👤 Criando clientes do ecommerce...');

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: {
        clientId_email: {
          clientId: bemmecare.id,
          email: 'maria.silva@email.com',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria.silva@email.com',
        phone: '(11) 55555-5555',
        birthDate: new Date('1990-05-15'),
        gender: 'FEMALE',
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: {
        clientId_email: {
          clientId: bemmecare.id,
          email: 'joao.santos@email.com',
        },
      },
      update: {},
      create: {
        clientId: bemmecare.id,
        firstName: 'João',
        lastName: 'Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 44444-4444',
        birthDate: new Date('1985-08-22'),
        gender: 'MALE',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Clientes do ecommerce criados');

  console.log('🎉 Seed do BemMeCare concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo:');
  console.log(`- Cliente: ${bemmecare.name} (${bemmecare.slug})`);
  console.log(`- Usuários: ${admin.name}, ${employee.name}`);
  console.log(`- Categorias: ${categories.length}`);
  console.log(`- Funcionários: ${employees.length}`);
  console.log(`- Serviços: ${services.length}`);
  console.log(`- Produtos: ${products.length}`);
  console.log(`- Agendamentos: ${appointments.length}`);
  console.log(`- Pedidos: ${order.orderNumber}`);
  console.log(`- Clientes Ecommerce: ${customers.length}`);
  console.log('');
  console.log('🔑 Credenciais de acesso:');
  console.log(`- Admin: admin@bemmecare.com / admin123`);
  console.log(`- Funcionário: funcionario@bemmecare.com / employee123`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
