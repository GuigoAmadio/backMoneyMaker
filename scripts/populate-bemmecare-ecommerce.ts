import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function populateBemMeCareEcommerce() {
  console.log('🛍️ Populando BemMeCare - Sistema de Vendas e Gestão Pessoal...\n');

  try {
    // Verificar se já existe pelo slug
    const bemMeCareClient = await prisma.client.findUnique({
      where: { slug: 'bemmecare' },
    });

    if (!bemMeCareClient) {
      console.error('❌ Cliente BemMeCare não encontrado! Execute create-bemmecare.ts primeiro.');
      return;
    }

    const clientId = bemMeCareClient.id;
    console.log(`✅ Cliente BemMeCare encontrado: ${clientId}\n`);

    // Atualizar configurações do cliente para ecommerce + gestão pessoal
    await prisma.client.update({
      where: { id: clientId },
      data: {
        settings: JSON.stringify({
          type: 'ecommerce_personal',
          theme: 'purple',
          features: [
            'ecommerce',
            'products',
            'orders',
            'customers',
            'appointments',
            'dashboard',
            'analytics',
          ],
          businessType: 'Vendas Online + Gestão Pessoal',
          workingHours: {
            monday: '09:00-18:00',
            tuesday: '09:00-18:00',
            wednesday: '09:00-18:00',
            thursday: '09:00-18:00',
            friday: '09:00-18:00',
            saturday: '09:00-14:00',
            sunday: 'closed',
          },
        }),
      },
    });

    // Limpar dados antigos se necessário
    console.log('🧹 Limpando dados antigos...');
    await prisma.ecommerceOrderItem.deleteMany({ where: { order: { clientId } } });
    await prisma.ecommerceOrder.deleteMany({ where: { clientId } });
    await prisma.address.deleteMany({ where: { customer: { clientId } } });
    await prisma.customer.deleteMany({ where: { clientId } });
    await prisma.appointment.deleteMany({ where: { clientId } });
    await prisma.orderItem.deleteMany({ where: { order: { clientId } } });
    await prisma.order.deleteMany({ where: { clientId } });
    await prisma.product.deleteMany({ where: { clientId } });
    await prisma.service.deleteMany({ where: { clientId } });
    await prisma.category.deleteMany({ where: { clientId } });
    await prisma.employee.deleteMany({ where: { clientId } });

    // Criar funcionários para ecommerce/gestão
    console.log('👥 Criando equipe...');
    const funcionarios = [
      {
        name: 'Maria Silva',
        email: 'maria.silva@bemmecare.com',
        position: 'Gerente Comercial',
        phone: '(11) 99999-2001',
      },
      {
        name: 'João Santos',
        email: 'joao.santos@bemmecare.com',
        position: 'Vendedor',
        phone: '(11) 99999-2002',
      },
      {
        name: 'Ana Costa',
        email: 'ana.costa@bemmecare.com',
        position: 'Atendimento ao Cliente',
        phone: '(11) 99999-2003',
      },
    ];

    const employees: any[] = [];
    for (const func of funcionarios) {
      const employee = await prisma.employee.create({
        data: {
          clientId: clientId,
          ...func,
          workingHours: {
            monday: '09:00-18:00',
            tuesday: '09:00-18:00',
            wednesday: '09:00-18:00',
            thursday: '09:00-18:00',
            friday: '09:00-18:00',
            saturday: '09:00-14:00',
          },
        },
      });
      employees.push(employee);
    }

    // Criar categorias de produtos
    console.log('📂 Criando categorias...');
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          clientId,
          name: 'Eletrônicos',
          description: 'Produtos eletrônicos e gadgets',
          color: '#3B82F6',
          type: 'product',
        },
      }),
      prisma.category.create({
        data: {
          clientId,
          name: 'Casa & Decoração',
          description: 'Itens para casa e decoração',
          color: '#10B981',
          type: 'product',
        },
      }),
      prisma.category.create({
        data: {
          clientId,
          name: 'Moda & Acessórios',
          description: 'Roupas, sapatos e acessórios',
          color: '#F59E0B',
          type: 'product',
        },
      }),
      prisma.category.create({
        data: {
          clientId,
          name: 'Serviços Pessoais',
          description: 'Agendamentos e serviços pessoais',
          color: '#8B5CF6',
          type: 'service',
        },
      }),
    ]);

    // Criar produtos
    console.log('🛍️ Criando produtos...');
    const products = await Promise.all([
      // Eletrônicos
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[0].id,
          name: 'Smartphone Galaxy A54',
          description: 'Smartphone Samsung Galaxy A54 128GB, Tela 6.4", Câmera Tripla 50MP',
          price: 1299.99,
          sku: 'ELEC001',
          stock: 25,
          minStock: 5,
          isFeatured: true,
          images: ['https://via.placeholder.com/400x400/3B82F6/white?text=Galaxy+A54'],
        },
      }),
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[0].id,
          name: 'Fone Bluetooth JBL',
          description: 'Fone de ouvido JBL Tune 510BT Bluetooth sem fio',
          price: 199.9,
          sku: 'ELEC002',
          stock: 40,
          minStock: 8,
          isFeatured: true,
          images: ['https://via.placeholder.com/400x400/3B82F6/white?text=JBL+Fone'],
        },
      }),

      // Casa & Decoração
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[1].id,
          name: 'Luminária LED Mesa',
          description: 'Luminária LED de mesa com regulagem de intensidade',
          price: 89.9,
          sku: 'CASA001',
          stock: 30,
          minStock: 6,
          images: ['https://via.placeholder.com/400x400/10B981/white?text=Luminaria+LED'],
        },
      }),
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[1].id,
          name: 'Vaso Decorativo Cerâmica',
          description: 'Vaso decorativo de cerâmica artesanal 25cm',
          price: 45.0,
          sku: 'CASA002',
          stock: 15,
          minStock: 3,
          images: ['https://via.placeholder.com/400x400/10B981/white?text=Vaso+Ceramica'],
        },
      }),

      // Moda & Acessórios
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[2].id,
          name: 'Relógio Smartwatch',
          description: 'Smartwatch com monitor cardíaco e GPS',
          price: 299.99,
          sku: 'MODA001',
          stock: 20,
          minStock: 4,
          isFeatured: true,
          images: ['https://via.placeholder.com/400x400/F59E0B/white?text=Smartwatch'],
        },
      }),
      prisma.product.create({
        data: {
          clientId,
          categoryId: categories[2].id,
          name: 'Bolsa Feminina Couro',
          description: 'Bolsa feminina de couro sintético com alça regulável',
          price: 129.9,
          sku: 'MODA002',
          stock: 12,
          minStock: 2,
          images: ['https://via.placeholder.com/400x400/F59E0B/white?text=Bolsa+Couro'],
        },
      }),
    ]);

    // Criar serviços para agenda pessoal
    console.log('📅 Criando serviços de agenda...');
    const services = await Promise.all([
      prisma.service.create({
        data: {
          clientId,
          categoryId: categories[3].id,
          name: 'Consultoria Pessoal',
          description: 'Sessão de consultoria e organização pessoal',
          duration: 60,
          price: 150.0,
          maxAdvanceBooking: 30,
          minAdvanceBooking: 1,
        },
      }),
      prisma.service.create({
        data: {
          clientId,
          categoryId: categories[3].id,
          name: 'Reunião de Planejamento',
          description: 'Reunião para planejamento de projetos pessoais',
          duration: 90,
          price: 200.0,
          maxAdvanceBooking: 15,
          minAdvanceBooking: 2,
        },
      }),
      prisma.service.create({
        data: {
          clientId,
          categoryId: categories[3].id,
          name: 'Sessão de Mentoria',
          description: 'Mentoria individual para desenvolvimento pessoal',
          duration: 45,
          price: 120.0,
          maxAdvanceBooking: 21,
          minAdvanceBooking: 1,
        },
      }),
    ]);

    // Associar funcionários aos serviços
    for (const service of services) {
      await prisma.service.update({
        where: { id: service.id },
        data: {
          employees: {
            connect: employees.map((emp) => ({ id: emp.id })),
          },
        },
      });
    }

    // Criar clientes do ecommerce
    console.log('👥 Criando clientes do ecommerce...');
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          clientId,
          firstName: 'Pedro',
          lastName: 'Oliveira',
          email: 'pedro.oliveira@email.com',
          phone: '(11) 98888-3001',
          document: '123.456.789-01',
          birthDate: new Date('1990-05-15'),
          gender: 'MALE',
          password: await bcrypt.hash('123456', 10),
          emailVerified: true,
        },
      }),
      prisma.customer.create({
        data: {
          clientId,
          firstName: 'Carla',
          lastName: 'Santos',
          email: 'carla.santos@email.com',
          phone: '(11) 98888-3002',
          document: '987.654.321-09',
          birthDate: new Date('1985-08-22'),
          gender: 'FEMALE',
          password: await bcrypt.hash('123456', 10),
          emailVerified: true,
        },
      }),
      prisma.customer.create({
        data: {
          clientId,
          firstName: 'Roberto',
          lastName: 'Silva',
          email: 'roberto.silva@email.com',
          phone: '(11) 98888-3003',
          document: '456.789.123-45',
          birthDate: new Date('1992-12-10'),
          gender: 'MALE',
          password: await bcrypt.hash('123456', 10),
          emailVerified: true,
        },
      }),
    ]);

    // Criar endereços para os clientes
    console.log('🏠 Criando endereços...');
    for (let i = 0; i < customers.length; i++) {
      await prisma.address.create({
        data: {
          customerId: customers[i].id,
          label: 'Casa',
          isDefault: true,
          type: 'BOTH',
          recipientName: `${customers[i].firstName} ${customers[i].lastName}`,
          street: `Rua das Flores, ${100 + i * 50}`,
          number: `${100 + i}`,
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: `0123${i}-567`,
          country: 'BR',
        },
      });
    }

    // Criar alguns pedidos de exemplo
    console.log('📦 Criando pedidos de exemplo...');
    const order1 = await prisma.ecommerceOrder.create({
      data: {
        clientId,
        customerId: customers[0].id,
        orderNumber: `BMC-${Date.now()}-001`,
        status: 'DELIVERED',
        subtotal: 1499.89,
        shippingCost: 15.9,
        tax: 0,
        total: 1515.79,
      },
    });

    await prisma.ecommerceOrderItem.create({
      data: {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 1,
        unitPrice: 1299.99,
        totalPrice: 1299.99,
        productName: products[0].name,
        productSku: products[0].sku,
      },
    });

    await prisma.ecommerceOrderItem.create({
      data: {
        orderId: order1.id,
        productId: products[1].id,
        quantity: 1,
        unitPrice: 199.9,
        totalPrice: 199.9,
        productName: products[1].name,
        productSku: products[1].sku,
      },
    });

    // Criar agendamentos de exemplo
    console.log('📅 Criando agendamentos...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    // Buscar um usuário para os agendamentos
    const adminUser = await prisma.user.findFirst({
      where: { clientId, role: 'ADMIN' },
    });

    if (adminUser && employees.length > 0) {
      await prisma.appointment.create({
        data: {
          clientId,
          userId: adminUser.id,
          employeeId: employees[0].id,
          serviceId: services[0].id,
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          status: 'SCHEDULED',
          description: 'Consultoria sobre organização de rotina',
          price: 150.0,
          paymentStatus: 'PENDING',
        },
      });

      await prisma.appointment.create({
        data: {
          clientId,
          userId: adminUser.id,
          employeeId: employees[0].id,
          serviceId: services[1].id,
          startTime: nextWeek,
          endTime: new Date(nextWeek.getTime() + 90 * 60 * 1000),
          status: 'CONFIRMED',
          description: 'Planejamento de metas para 2024',
          price: 200.0,
          paymentStatus: 'PAID',
        },
      });
    }

    console.log('\n🎉 BEMMECARE ECOMMERCE + GESTÃO PESSOAL POPULADO!');
    console.log('='.repeat(60));
    console.log('🔐 CREDENCIAIS DE ACESSO:');
    console.log('   📧 Email: admin@bemmecare.com');
    console.log('   🔑 Senha: admin123');
    console.log(`   🆔 Client ID: ${clientId}`);
    console.log('   🌐 Frontend: http://localhost:3001');
    console.log('');
    console.log('📊 DADOS CRIADOS:');
    console.log(`   👥 ${funcionarios.length} funcionários`);
    console.log(`   📂 ${categories.length} categorias`);
    console.log(`   🛍️ ${products.length} produtos`);
    console.log(`   📅 ${services.length} serviços de agenda`);
    console.log(`   👤 ${customers.length} clientes do ecommerce`);
    console.log(`   🏠 ${customers.length} endereços`);
    console.log(`   📦 1 pedido de exemplo`);
    console.log(`   📅 2 agendamentos de exemplo`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Erro ao popular BemMeCare:', error);
  }
}

populateBemMeCareEcommerce()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
