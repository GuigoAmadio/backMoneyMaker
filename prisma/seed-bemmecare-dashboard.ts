import {
  PrismaClient,
  AppointmentStatus,
  OrderStatus,
  PaymentStatus,
  EcommerceOrderStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do BemMeCare Dashboard...');

  // Gera hash da senha
  const senhaHash = await bcrypt.hash('senha123', 12);

  // 1. Criar cliente BemMeCare
  let bemmecareClient = await prisma.client.findFirst({
    where: { id: '0ac8fc12-06c8-427e-acc4-663ee5245360' },
  });

  if (!bemmecareClient) {
    bemmecareClient = await prisma.client.create({
      data: {
        id: '0ac8fc12-06c8-427e-acc4-663ee5245360',
        name: 'BemMeCare',
        slug: 'bemmecare',
        email: 'contato@bemmecare.com',
        status: 'ACTIVE',
        plan: 'premium',
      },
    });
    console.log('✅ Cliente BemMeCare criado');
  } else {
    console.log('✅ Cliente BemMeCare já existe');
  }

  // 2. Criar usuário admin para BemMeCare
  let adminUser = await prisma.user.findFirst({
    where: {
      clientId: bemmecareClient.id,
      email: 'admin@bemmecare.com',
    },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Administrador BemMeCare',
        email: 'admin@bemmecare.com',
        password: senhaHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        clientId: bemmecareClient.id,
        emailVerified: true,
      },
    });
    console.log('✅ Usuário admin criado');
  } else {
    console.log('✅ Usuário admin já existe');
  }

  // 3. Criar funcionários
  const employees = [];
  const employeeData = [
    { name: 'Dr. Maria Silva', email: 'maria@bemmecare.com', position: 'Psicóloga' },
    { name: 'Dr. João Santos', email: 'joao@bemmecare.com', position: 'Psicólogo' },
    { name: 'Dra. Ana Costa', email: 'ana@bemmecare.com', position: 'Terapeuta' },
  ];

  for (const empData of employeeData) {
    let employee = await prisma.employee.findFirst({
      where: {
        clientId: bemmecareClient.id,
        email: empData.email,
      },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          ...empData,
          clientId: bemmecareClient.id,
          isActive: true,
        },
      });
      console.log(`✅ Funcionário ${empData.name} criado`);
    } else {
      console.log(`✅ Funcionário ${empData.name} já existe`);
    }
    employees.push(employee);
  }

  // 4. Criar categorias de produtos
  const categories = [];
  const categoryData = [
    { name: 'Suplementos', color: '#3B82F6' },
    { name: 'Cosméticos', color: '#EC4899' },
    { name: 'Bem-estar', color: '#10B981' },
    { name: 'Fitness', color: '#F59E0B' },
  ];

  for (const catData of categoryData) {
    let category = await prisma.category.findFirst({
      where: {
        name: catData.name,
        clientId: bemmecareClient.id,
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          ...catData,
          clientId: bemmecareClient.id,
        },
      });
      console.log(`✅ Categoria ${catData.name} criada`);
    } else {
      console.log(`✅ Categoria ${catData.name} já existe`);
    }
    categories.push(category);
  }

  // 5. Criar produtos
  const products = [];
  const productData = [
    {
      name: 'Vitamina C 1000mg',
      description: 'Suplemento de vitamina C para imunidade',
      price: 45.9,
      stock: 50,
      categoryId: categories[0].id,
    },
    {
      name: 'Óleo de Coco Extra Virgem',
      description: 'Óleo de coco 100% natural',
      price: 32.5,
      stock: 30,
      categoryId: categories[0].id,
    },
    {
      name: 'Creme Hidratante Facial',
      description: 'Hidratante com ácido hialurônico',
      price: 89.9,
      stock: 25,
      categoryId: categories[1].id,
    },
    {
      name: 'Óleo Essencial de Lavanda',
      description: 'Óleo essencial para relaxamento',
      price: 28.0,
      stock: 40,
      categoryId: categories[2].id,
    },
    {
      name: 'Proteína Whey Isolada',
      description: 'Proteína de alta qualidade',
      price: 120.0,
      stock: 15,
      categoryId: categories[3].id,
    },
    {
      name: 'Chá Verde Orgânico',
      description: 'Chá verde para emagrecimento',
      price: 18.9,
      stock: 60,
      categoryId: categories[2].id,
    },
    {
      name: 'Máscara Facial de Argila',
      description: 'Máscara purificante',
      price: 45.0,
      stock: 20,
      categoryId: categories[1].id,
    },
    {
      name: 'BCAA Aminoácidos',
      description: 'Aminoácidos essenciais',
      price: 75.5,
      stock: 35,
      categoryId: categories[3].id,
    },
  ];

  for (const prodData of productData) {
    let product = await prisma.product.findFirst({
      where: {
        name: prodData.name,
        clientId: bemmecareClient.id,
      },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          ...prodData,
          clientId: bemmecareClient.id,
          isActive: true,
        },
      });
      console.log(`✅ Produto ${prodData.name} criado`);
    } else {
      console.log(`✅ Produto ${prodData.name} já existe`);
    }
    products.push(product);
  }

  // 6. Criar serviços
  const services = [];
  const serviceData = [
    {
      name: 'Consulta Psicológica',
      description: 'Sessão de terapia individual',
      duration: 60,
      price: 150.0,
    },
    {
      name: 'Avaliação Psicológica',
      description: 'Avaliação completa psicológica',
      duration: 90,
      price: 250.0,
    },
    {
      name: 'Terapia de Casal',
      description: 'Sessão de terapia para casais',
      duration: 90,
      price: 200.0,
    },
    {
      name: 'Acompanhamento Online',
      description: 'Consulta psicológica online',
      duration: 45,
      price: 120.0,
    },
  ];

  for (const servData of serviceData) {
    let service = await prisma.service.findFirst({
      where: {
        name: servData.name,
        clientId: bemmecareClient.id,
      },
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          ...servData,
          clientId: bemmecareClient.id,
        },
      });
      console.log(`✅ Serviço ${servData.name} criado`);
    } else {
      console.log(`✅ Serviço ${servData.name} já existe`);
    }
    services.push(service);
  }

  // 7. Criar clientes ecommerce
  const customers = [];
  const customerData = [
    {
      firstName: 'Carlos',
      lastName: 'Oliveira',
      email: 'carlos@email.com',
      phone: '(11) 99999-1111',
    },
    {
      firstName: 'Fernanda',
      lastName: 'Lima',
      email: 'fernanda@email.com',
      phone: '(11) 99999-2222',
    },
    {
      firstName: 'Roberto',
      lastName: 'Alves',
      email: 'roberto@email.com',
      phone: '(11) 99999-3333',
    },
    {
      firstName: 'Patrícia',
      lastName: 'Costa',
      email: 'patricia@email.com',
      phone: '(11) 99999-4444',
    },
    { firstName: 'Lucas', lastName: 'Mendes', email: 'lucas@email.com', phone: '(11) 99999-5555' },
  ];

  for (const custData of customerData) {
    let customer = await prisma.customer.findFirst({
      where: {
        email: custData.email,
        clientId: bemmecareClient.id,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          ...custData,
          clientId: bemmecareClient.id,
          isActive: true,
        },
      });
      console.log(`✅ Cliente ${custData.firstName} ${custData.lastName} criado`);
    } else {
      console.log(`✅ Cliente ${custData.firstName} ${custData.lastName} já existe`);
    }
    customers.push(customer);
  }

  // 8. Criar pedidos e order items (para dashboard de vendas)
  const orders = [];
  const orderData = [
    {
      customerId: customers[0].id,
      subtotal: 78.4,
      total: 78.4,
      status: EcommerceOrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      customerId: customers[1].id,
      subtotal: 165.9,
      total: 165.9,
      status: EcommerceOrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      customerId: customers[2].id,
      subtotal: 195.5,
      total: 195.5,
      status: EcommerceOrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      customerId: customers[3].id,
      subtotal: 89.9,
      total: 89.9,
      status: EcommerceOrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      customerId: customers[4].id,
      subtotal: 120.0,
      total: 120.0,
      status: EcommerceOrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
  ];

  for (const orderInfo of orderData) {
    let order = await prisma.ecommerceOrder.create({
      data: {
        ...orderInfo,
        clientId: bemmecareClient.id,
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });
    orders.push(order);
    console.log(`✅ Pedido ${order.orderNumber} criado`);
  }

  // 9. Criar order items (itens dos pedidos)
  const orderItemsData = [
    // Pedido 1: 2 produtos
    {
      orderId: orders[0].id,
      productId: products[0].id,
      quantity: 1,
      unitPrice: 45.9,
      totalPrice: 45.9,
      productName: products[0].name,
    },
    {
      orderId: orders[0].id,
      productId: products[2].id,
      quantity: 1,
      unitPrice: 32.5,
      totalPrice: 32.5,
      productName: products[2].name,
    },

    // Pedido 2: 3 produtos
    {
      orderId: orders[1].id,
      productId: products[3].id,
      quantity: 2,
      unitPrice: 28.0,
      totalPrice: 56.0,
      productName: products[3].name,
    },
    {
      orderId: orders[1].id,
      productId: products[4].id,
      quantity: 1,
      unitPrice: 120.0,
      totalPrice: 120.0,
      productName: products[4].name,
    },
    {
      orderId: orders[1].id,
      productId: products[5].id,
      quantity: 1,
      unitPrice: 18.9,
      totalPrice: 18.9,
      productName: products[5].name,
    },

    // Pedido 3: 2 produtos
    {
      orderId: orders[2].id,
      productId: products[1].id,
      quantity: 2,
      unitPrice: 32.5,
      totalPrice: 65.0,
      productName: products[1].name,
    },
    {
      orderId: orders[2].id,
      productId: products[6].id,
      quantity: 1,
      unitPrice: 45.0,
      totalPrice: 45.0,
      productName: products[6].name,
    },
    {
      orderId: orders[2].id,
      productId: products[7].id,
      quantity: 1,
      unitPrice: 75.5,
      totalPrice: 75.5,
      productName: products[7].name,
    },

    // Pedido 4: 1 produto
    {
      orderId: orders[3].id,
      productId: products[2].id,
      quantity: 1,
      unitPrice: 89.9,
      totalPrice: 89.9,
      productName: products[2].name,
    },

    // Pedido 5: 1 produto
    {
      orderId: orders[4].id,
      productId: products[4].id,
      quantity: 1,
      unitPrice: 120.0,
      totalPrice: 120.0,
      productName: products[4].name,
    },
  ];

  for (const itemData of orderItemsData) {
    await prisma.ecommerceOrderItem.create({
      data: itemData,
    });
  }
  console.log(`✅ ${orderItemsData.length} itens de pedido criados`);

  // 10. Criar agendamentos (para dashboard de consultas)
  const appointments = [];
  const appointmentData = [
    {
      serviceId: services[0].id,
      userId: adminUser.id,
      employeeId: employees[0].id,
      status: AppointmentStatus.COMPLETED,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      serviceId: services[1].id,
      userId: adminUser.id,
      employeeId: employees[1].id,
      status: AppointmentStatus.COMPLETED,
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      serviceId: services[2].id,
      userId: adminUser.id,
      employeeId: employees[2].id,
      status: AppointmentStatus.CONFIRMED,
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      serviceId: services[3].id,
      userId: adminUser.id,
      employeeId: employees[0].id,
      status: AppointmentStatus.SCHEDULED,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      serviceId: services[0].id,
      userId: adminUser.id,
      employeeId: employees[1].id,
      status: AppointmentStatus.COMPLETED,
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      serviceId: services[1].id,
      userId: adminUser.id,
      employeeId: employees[2].id,
      status: AppointmentStatus.COMPLETED,
      startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const appData of appointmentData) {
    const startTime = appData.startTime;
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hora

    const appointment = await prisma.appointment.create({
      data: {
        ...appData,
        clientId: bemmecareClient.id,
        startTime,
        endTime,
        description: `Agendamento ${appData.status.toLowerCase()}`,
      },
    });
    appointments.push(appointment);
    console.log(`✅ Agendamento ${appointment.id} criado (${appData.status})`);
  }

  console.log('\n🎉 Seed do BemMeCare Dashboard concluído com sucesso!');
  console.log('\n📊 Dados criados:');
  console.log(`  • Cliente: ${bemmecareClient.name}`);
  console.log(`  • Usuário admin: ${adminUser.email} (senha: senha123)`);
  console.log(`  • Funcionários: ${employees.length}`);
  console.log(`  • Categorias: ${categories.length}`);
  console.log(`  • Produtos: ${products.length}`);
  console.log(`  • Serviços: ${services.length}`);
  console.log(`  • Clientes ecommerce: ${customers.length}`);
  console.log(`  • Pedidos: ${orders.length}`);
  console.log(`  • Agendamentos: ${appointments.length}`);
  console.log('\n🔑 Credenciais para login:');
  console.log(`  • Email: ${adminUser.email}`);
  console.log(`  • Senha: senha123`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
