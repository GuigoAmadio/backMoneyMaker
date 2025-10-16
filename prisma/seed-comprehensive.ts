import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// IDs dos clientes (assumindo que já existem)
const BEMMECARE_CLIENT_ID = '4a2d7176-3f9d-43da-9a7f-e97d08f54744';
const EXPATRIAMENTE_CLIENT_ID = '2a2ad019-c94a-4f35-9dc8-dd877b3e8ec8';

// Dados para BemMeCare (E-commerce, Schedule, Finance)
const bemmecareProducts = [
  { name: 'Suplemento Vitamina D3', price: 45.9, description: 'Vitamina D3 1000UI - 60 cápsulas' },
  { name: 'Whey Protein', price: 89.9, description: 'Whey Protein 1kg - Chocolate' },
  { name: 'Creatina Monohidratada', price: 32.5, description: 'Creatina 300g - Pura' },
  { name: 'Multivitamínico', price: 67.8, description: 'Multivitamínico Completo - 90 cápsulas' },
  { name: 'Ômega 3', price: 54.9, description: 'Ômega 3 1000mg - 120 cápsulas' },
  { name: 'BCAA', price: 78.9, description: 'BCAA 2:1:1 - 300g' },
  { name: 'Glutamina', price: 42.9, description: 'Glutamina 300g - Pó' },
  { name: 'Termogênico', price: 65.9, description: 'Termogênico Natural - 60 cápsulas' },
  { name: 'Colágeno', price: 89.9, description: 'Colágeno Hidrolisado - 300g' },
  { name: 'Probiótico', price: 58.9, description: 'Probiótico 30 cápsulas' },
  { name: 'Magnésio', price: 35.9, description: 'Magnésio Quelato - 60 cápsulas' },
  { name: 'Zinco', price: 28.9, description: 'Zinco 15mg - 60 cápsulas' },
  { name: 'Vitamina C', price: 32.9, description: 'Vitamina C 1000mg - 60 cápsulas' },
  { name: 'Ferro', price: 39.9, description: 'Ferro Quelato - 60 cápsulas' },
  { name: 'Cálcio', price: 48.9, description: 'Cálcio + Vitamina D - 60 cápsulas' },
  { name: 'Biotina', price: 42.9, description: 'Biotina 10mg - 60 cápsulas' },
  { name: 'Coenzima Q10', price: 78.9, description: 'Coenzima Q10 100mg - 60 cápsulas' },
  { name: 'Melatonina', price: 35.9, description: 'Melatonina 3mg - 60 cápsulas' },
  { name: 'Ashwagandha', price: 58.9, description: 'Ashwagandha 500mg - 60 cápsulas' },
  { name: 'Curcumina', price: 45.9, description: 'Curcumina 500mg - 60 cápsulas' },
];

const bemmecareUsers = [
  { name: 'Ana Silva', email: 'ana.silva@email.com', phone: '+55 11 99999-0001' },
  { name: 'Carlos Santos', email: 'carlos.santos@email.com', phone: '+55 11 99999-0002' },
  { name: 'Maria Oliveira', email: 'maria.oliveira@email.com', phone: '+55 11 99999-0003' },
  { name: 'João Costa', email: 'joao.costa@email.com', phone: '+55 11 99999-0004' },
  { name: 'Fernanda Lima', email: 'fernanda.lima@email.com', phone: '+55 11 99999-0005' },
  { name: 'Pedro Alves', email: 'pedro.alves@email.com', phone: '+55 11 99999-0006' },
  { name: 'Juliana Rocha', email: 'juliana.rocha@email.com', phone: '+55 11 99999-0007' },
  { name: 'Rafael Souza', email: 'rafael.souza@email.com', phone: '+55 11 99999-0008' },
  { name: 'Camila Ferreira', email: 'camila.ferreira@email.com', phone: '+55 11 99999-0009' },
  { name: 'Lucas Martins', email: 'lucas.martins@email.com', phone: '+55 11 99999-0010' },
  { name: 'Patricia Gomes', email: 'patricia.gomes@email.com', phone: '+55 11 99999-0011' },
  { name: 'Diego Rodrigues', email: 'diego.rodrigues@email.com', phone: '+55 11 99999-0012' },
  { name: 'Amanda Pereira', email: 'amanda.pereira@email.com', phone: '+55 11 99999-0013' },
  { name: 'Bruno Carvalho', email: 'bruno.carvalho@email.com', phone: '+55 11 99999-0014' },
  { name: 'Larissa Nunes', email: 'larissa.nunes@email.com', phone: '+55 11 99999-0015' },
  { name: 'Gabriel Silva', email: 'gabriel.silva@email.com', phone: '+55 11 99999-0016' },
  { name: 'Isabela Costa', email: 'isabela.costa@email.com', phone: '+55 11 99999-0017' },
  { name: 'Thiago Almeida', email: 'thiago.almeida@email.com', phone: '+55 11 99999-0018' },
  { name: 'Natália Barbosa', email: 'natalia.barbosa@email.com', phone: '+55 11 99999-0019' },
  { name: 'Marcos Vieira', email: 'marcos.vieira@email.com', phone: '+55 11 99999-0020' },
];

// Dados para Expatriamente (Appointments, Users)
const expatriamenteUsers = [
  { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@expatriamente.com', phone: '+1 555-0101' },
  { name: 'Dr. Michael Chen', email: 'michael.chen@expatriamente.com', phone: '+1 555-0102' },
  { name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@expatriamente.com', phone: '+1 555-0103' },
  { name: 'Dr. James Wilson', email: 'james.wilson@expatriamente.com', phone: '+1 555-0104' },
  { name: 'Dr. Lisa Thompson', email: 'lisa.thompson@expatriamente.com', phone: '+1 555-0105' },
  { name: 'Dr. Robert Garcia', email: 'robert.garcia@expatriamente.com', phone: '+1 555-0106' },
  { name: 'Dr. Jennifer Lee', email: 'jennifer.lee@expatriamente.com', phone: '+1 555-0107' },
  { name: 'Dr. David Brown', email: 'david.brown@expatriamente.com', phone: '+1 555-0108' },
  { name: 'Dr. Maria Gonzalez', email: 'maria.gonzalez@expatriamente.com', phone: '+1 555-0109' },
  { name: 'Dr. Kevin Taylor', email: 'kevin.taylor@expatriamente.com', phone: '+1 555-0110' },
  { name: 'Dr. Amanda White', email: 'amanda.white@expatriamente.com', phone: '+1 555-0111' },
  {
    name: 'Dr. Christopher Davis',
    email: 'christopher.davis@expatriamente.com',
    phone: '+1 555-0112',
  },
  { name: 'Dr. Rachel Miller', email: 'rachel.miller@expatriamente.com', phone: '+1 555-0113' },
  { name: 'Dr. Daniel Anderson', email: 'daniel.anderson@expatriamente.com', phone: '+1 555-0114' },
  {
    name: 'Dr. Jessica Martinez',
    email: 'jessica.martinez@expatriamente.com',
    phone: '+1 555-0115',
  },
  { name: 'Dr. Matthew Jackson', email: 'matthew.jackson@expatriamente.com', phone: '+1 555-0116' },
  { name: 'Dr. Ashley Moore', email: 'ashley.moore@expatriamente.com', phone: '+1 555-0117' },
  { name: 'Dr. Andrew Clark', email: 'andrew.clark@expatriamente.com', phone: '+1 555-0118' },
  { name: 'Dr. Samantha Lewis', email: 'samantha.lewis@expatriamente.com', phone: '+1 555-0119' },
  { name: 'Dr. Ryan Walker', email: 'ryan.walker@expatriamente.com', phone: '+1 555-0120' },
];

const services = [
  { name: 'Consulta Psicológica', description: 'Sessão de terapia individual', duration: 50 },
  { name: 'Avaliação Psicológica', description: 'Avaliação completa do paciente', duration: 90 },
  { name: 'Terapia de Casal', description: 'Sessão de terapia para casais', duration: 60 },
  { name: 'Terapia Familiar', description: 'Sessão de terapia familiar', duration: 75 },
  {
    name: 'Orientação Vocacional',
    description: 'Orientação para escolha profissional',
    duration: 60,
  },
  {
    name: 'Avaliação Neuropsicológica',
    description: 'Avaliação de funções cognitivas',
    duration: 120,
  },
  { name: 'Terapia Cognitivo-Comportamental', description: 'TCC individual', duration: 50 },
  { name: 'Grupo de Apoio', description: 'Sessão em grupo', duration: 90 },
  { name: 'Supervisão Clínica', description: 'Supervisão para profissionais', duration: 60 },
  { name: 'Psicodiagnóstico', description: 'Avaliação diagnóstica completa', duration: 120 },
];

async function main() {
  console.log('🌱 Iniciando seed completo...');

  // 1. Criar produtos para BemMeCare
  console.log('📦 Criando produtos para BemMeCare...');
  const createdProducts = [];
  for (const product of bemmecareProducts) {
    const created = await prisma.product.create({
      data: {
        client: { connect: { id: BEMMECARE_CLIENT_ID } },
        name: product.name,
        description: product.description,
        price: new Decimal(product.price),
        stock: Math.floor(Math.random() * 100) + 10,
        sku: `BM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        category: {
          create: {
            name: 'Suplementos',
            description: 'Categoria de suplementos',
            client: { connect: { id: BEMMECARE_CLIENT_ID } },
          },
        },
      },
    });
    createdProducts.push(created);
  }

  // 2. Criar usuários para BemMeCare
  console.log('👥 Criando usuários para BemMeCare...');
  const bemmecareUserIds = [];
  for (const user of bemmecareUsers) {
    const created = await prisma.user.upsert({
      where: {
        clientId_email: {
          clientId: BEMMECARE_CLIENT_ID,
          email: user.email,
        },
      },
      update: {
        name: user.name,
        phone: user.phone,
        status: 'ACTIVE',
      },
      create: {
        clientId: BEMMECARE_CLIENT_ID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: '$2b$10$example.hash',
        role: 'CLIENT',
        status: 'ACTIVE',
      },
    });
    bemmecareUserIds.push(created.id);
  }

  // 3. Criar pedidos para BemMeCare
  console.log('🛒 Criando pedidos para BemMeCare...');
  const orderStatuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];
  const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  for (let i = 0; i < 20; i++) {
    const userId = bemmecareUserIds[Math.floor(Math.random() * bemmecareUserIds.length)];
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemTotal = Number(product.price) * quantity;
      total += itemTotal;

      items.push({
        productId: product.id,
        quantity,
        price: product.price,
      });
    }

    const order = await prisma.order.create({
      data: {
        clientId: BEMMECARE_CLIENT_ID,
        userId,
        orderNumber: `BM-${Date.now()}-${i}`,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)] as any,
        total: new Decimal(total),
        deliveryAddress: `Rua ${Math.floor(Math.random() * 1000) + 1}, ${Math.floor(Math.random() * 100) + 1}`,
        deliveryFee: new Decimal(Math.floor(Math.random() * 20) + 5),
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)] as any,
        paymentMethod: ['CREDIT_CARD', 'PIX', 'BOLETO'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 dias
      },
    });

    // Criar itens do pedido
    for (const item of items) {
      const subtotal = Number(item.price) * item.quantity;
      await prisma.orderItem.create({
        data: {
          order: { connect: { id: order.id } },
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          price: item.price,
          subtotal: new Decimal(subtotal),
          totalPrice: new Decimal(subtotal),
        },
      });
    }
  }

  // 4. Criar agendamentos para BemMeCare (Schedule)
  console.log('📅 Criando agendamentos para BemMeCare...');
  const scheduleStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];
  const scheduleCategories = ['WORK', 'PERSONAL', 'MEETING', 'APPOINTMENT', 'REMINDER', 'OTHER'];
  const schedulePriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 0; i < 20; i++) {
    const userId = bemmecareUserIds[Math.floor(Math.random() * bemmecareUserIds.length)];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 15); // ±15 dias
    startDate.setHours(
      Math.floor(Math.random() * 12) + 8,
      Math.floor(Math.random() * 4) * 15,
      0,
      0,
    );

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 4) + 1);

    await prisma.schedule.create({
      data: {
        clientId: BEMMECARE_CLIENT_ID,
        userId,
        date: startDate,
        title: [
          'Consulta Médica',
          'Reunião de Equipe',
          'Treinamento',
          'Avaliação de Produto',
          'Entrevista',
          'Apresentação',
          'Workshop',
          'Revisão de Contratos',
          'Planejamento Estratégico',
          'Feedback de Cliente',
        ][Math.floor(Math.random() * 10)],
        description: 'Descrição detalhada do agendamento',
        status: scheduleStatuses[Math.floor(Math.random() * scheduleStatuses.length)] as any,
        priority: schedulePriorities[Math.floor(Math.random() * schedulePriorities.length)] as any,
        startTime: startDate,
        endTime: endDate,
        allDay: Math.random() > 0.8,
        isRecurring: Math.random() > 0.7,
        category: scheduleCategories[Math.floor(Math.random() * scheduleCategories.length)] as any,
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
          Math.floor(Math.random() * 5)
        ],
      },
    });
  }

  // 5. Criar transações financeiras para BemMeCare
  console.log('💰 Criando transações financeiras para BemMeCare...');
  const transactionTypes = ['INCOME', 'EXPENSE'];
  const transactionStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];

  for (let i = 0; i < 20; i++) {
    const userId = bemmecareUserIds[Math.floor(Math.random() * bemmecareUserIds.length)];
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const amount = new Decimal(Math.floor(Math.random() * 5000) + 100);

    await prisma.transaction.create({
      data: {
        clientId: BEMMECARE_CLIENT_ID,
        userId,
        title:
          type === 'INCOME'
            ? ['Venda de Produto', 'Comissão', 'Bônus', 'Reembolso', 'Juros'][
                Math.floor(Math.random() * 5)
              ]
            : ['Compra de Estoque', 'Salário', 'Aluguel', 'Marketing', 'Equipamentos'][
                Math.floor(Math.random() * 5)
              ],
        description: `Transação ${type.toLowerCase()} - ${new Date().toLocaleDateString()}`,
        amount: type === 'INCOME' ? amount : new Decimal(-Number(amount)),
        type: type as any,
        status: transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)] as any,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
        tags:
          Math.random() > 0.5
            ? [['urgente', 'importante', 'mensal'][Math.floor(Math.random() * 3)]]
            : [],
      },
    });
  }

  // 6. Criar usuários para Expatriamente
  console.log('👥 Criando usuários para Expatriamente...');
  const expatriamenteUserIds = [];
  for (const user of expatriamenteUsers) {
    const created = await prisma.user.create({
      data: {
        clientId: EXPATRIAMENTE_CLIENT_ID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: '$2b$10$example.hash', // Hash de exemplo
        role: 'CLIENT',
        status: 'ACTIVE',
      },
    });
    expatriamenteUserIds.push(created.id);
  }

  // 7. Criar serviços para Expatriamente
  console.log('🏥 Criando serviços para Expatriamente...');
  const createdServices = [];
  for (const service of services) {
    const created = await prisma.service.create({
      data: {
        clientId: EXPATRIAMENTE_CLIENT_ID,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: new Decimal(Math.floor(Math.random() * 200) + 100),
      },
    });
    createdServices.push(created);
  }

  // 8. Criar agendamentos para Expatriamente
  console.log('📅 Criando agendamentos para Expatriamente...');
  const appointmentStatuses = [
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];

  for (let i = 0; i < 20; i++) {
    const userId = expatriamenteUserIds[Math.floor(Math.random() * expatriamenteUserIds.length)];
    const service = createdServices[Math.floor(Math.random() * createdServices.length)];

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + Math.floor(Math.random() * 30) - 15); // ±15 dias
    startTime.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 4) * 15, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + service.duration);

    await prisma.appointment.create({
      data: {
        clientId: EXPATRIAMENTE_CLIENT_ID,
        userId,
        serviceId: service.id,
        startTime,
        endTime,
        status: appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)] as any,
      },
    });
  }

  console.log('✅ Seed completo finalizado!');
  console.log(`📊 Dados criados:`);
  console.log(
    `   - BemMeCare: ${bemmecareProducts.length} produtos, ${bemmecareUsers.length} usuários, 20 pedidos, 20 agendamentos, 20 transações`,
  );
  console.log(
    `   - Expatriamente: ${expatriamenteUsers.length} usuários, ${services.length} serviços, 20 agendamentos`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
