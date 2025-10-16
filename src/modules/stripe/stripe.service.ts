import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      this.logger.warn('⚠️ STRIPE_SECRET_KEY não configurada. Serviço Stripe desabilitado.');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.logger.log('✅ Stripe Service inicializado');
  }

  /**
   * Criar sessão de checkout
   */
  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    clientId: string,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      this.logger.log(`🔍 Criando sessão de checkout para cliente: ${clientId}`);

      // Buscar ou criar cliente no Stripe
      const stripeCustomer = await this.getOrCreateStripeCustomer(
        dto.customerEmail,
        dto.customerName,
        clientId,
        dto.companyName,
      );

      // URLs de sucesso e cancelamento
      const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/checkout/cancel`;

      // Criar sessão de checkout
      const session = await this.stripe.checkout.sessions.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: dto.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          clientId,
          billingCycle: dto.billingCycle,
          companyName: dto.companyName || '',
          selectedServices: JSON.stringify(dto.selectedServices || []),
        },
        subscription_data: {
          trial_period_days: 30, // Trial de 30 dias
          metadata: {
            clientId,
            billingCycle: dto.billingCycle,
            selectedServices: JSON.stringify(dto.selectedServices || []),
          },
        },
      });

      this.logger.log(`✅ Sessão criada: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar sessão de checkout:', error);
      throw new BadRequestException(error.message || 'Erro ao criar sessão de checkout');
    }
  }

  /**
   * Buscar ou criar cliente no Stripe
   */
  private async getOrCreateStripeCustomer(
    email: string,
    name: string,
    clientId: string,
    companyName?: string,
  ): Promise<Stripe.Customer> {
    try {
      // Buscar cliente existente no banco de dados
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      // Se o cliente já tem stripeCustomerId, retornar
      if (client?.stripeCustomerId) {
        const customer = await this.stripe.customers.retrieve(client.stripeCustomerId);

        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      }

      // Criar novo cliente no Stripe
      const customer = await this.stripe.customers.create({
        email,
        name: companyName || name,
        metadata: {
          clientId,
          internalName: name,
        },
      });

      // Salvar stripeCustomerId no banco
      await this.prisma.client.update({
        where: { id: clientId },
        data: { stripeCustomerId: customer.id },
      });

      this.logger.log(`✅ Cliente Stripe criado: ${customer.id}`);

      return customer;
    } catch (error) {
      this.logger.error('❌ Erro ao criar cliente Stripe:', error);
      throw error;
    }
  }

  /**
   * Buscar assinatura do cliente
   */
  async getSubscription(clientId: string): Promise<any> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client?.stripeCustomerId) {
        return null;
      }

      const subscriptions = await this.stripe.subscriptions.list({
        customer: client.stripeCustomerId,
        limit: 1,
        status: 'all',
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];

      return {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0]?.price.nickname || 'Professional',
        currentPeriodStart: new Date(
          (subscription as any).current_period_start * 1000,
        ).toISOString(),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar assinatura:', error);
      throw new BadRequestException('Erro ao buscar assinatura');
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(clientId: string): Promise<{ message: string }> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client?.stripeCustomerId) {
        throw new BadRequestException('Cliente não possui assinatura');
      }

      const subscriptions = await this.stripe.subscriptions.list({
        customer: client.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        throw new BadRequestException('Nenhuma assinatura ativa encontrada');
      }

      // Cancelar no final do período
      await this.stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true,
      });

      this.logger.log(`✅ Assinatura cancelada: ${subscriptions.data[0].id}`);

      return {
        message: 'Assinatura cancelada com sucesso. Será encerrada no final do período atual.',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao cancelar assinatura:', error);
      throw new BadRequestException(error.message || 'Erro ao cancelar assinatura');
    }
  }

  /**
   * Reativar assinatura
   */
  async reactivateSubscription(clientId: string): Promise<{ message: string }> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client?.stripeCustomerId) {
        throw new BadRequestException('Cliente não possui assinatura');
      }

      const subscriptions = await this.stripe.subscriptions.list({
        customer: client.stripeCustomerId,
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        throw new BadRequestException('Nenhuma assinatura encontrada');
      }

      // Reativar assinatura
      await this.stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: false,
      });

      this.logger.log(`✅ Assinatura reativada: ${subscriptions.data[0].id}`);

      return {
        message: 'Assinatura reativada com sucesso.',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao reativar assinatura:', error);
      throw new BadRequestException(error.message || 'Erro ao reativar assinatura');
    }
  }

  /**
   * Criar portal do cliente
   */
  async createCustomerPortal(clientId: string): Promise<{ url: string }> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client?.stripeCustomerId) {
        throw new BadRequestException('Cliente não possui conta Stripe');
      }

      const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      const session = await this.stripe.billingPortal.sessions.create({
        customer: client.stripeCustomerId,
        return_url: `${baseUrl}/creator/settings`,
      });

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar portal:', error);
      throw new BadRequestException('Erro ao criar portal do cliente');
    }
  }

  /**
   * Processar webhook do Stripe
   */
  async handleWebhook(signature: string, payload: Buffer): Promise<any> {
    try {
      if (!this.stripe) {
        throw new BadRequestException('Stripe não configurado');
      }

      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

      if (!webhookSecret) {
        throw new BadRequestException('Webhook secret não configurado');
      }

      // Verificar assinatura do webhook
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      this.logger.log(`📨 Webhook recebido: ${event.type}`);

      // Processar eventos
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.log(`ℹ️ Evento não tratado: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Tratar checkout completado
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      const clientId = session.metadata?.clientId;

      if (!clientId) {
        this.logger.warn('⚠️ ClientId não encontrado no checkout session');
        return;
      }

      this.logger.log(`✅ Checkout completado para cliente: ${clientId}`);

      // Extrair serviços selecionados do metadata
      let selectedServices = [];
      try {
        selectedServices = JSON.parse(session.metadata?.selectedServices || '[]');
      } catch (e) {
        this.logger.warn('⚠️ Erro ao parsear selectedServices, usando array vazio');
      }

      // Calcular data de expiração (30 dias de trial + período da assinatura)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 30 dias trial + 30 dias primeiro período

      // Atualizar cliente com serviços ativos e trial
      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          plan: 'professional',
          status: 'TRIAL',
          activeServices: selectedServices,
          expiresAt,
        },
      });

      this.logger.log(`✅ Cliente atualizado com ${selectedServices.length} serviços ativos`);
    } catch (error) {
      this.logger.error('❌ Erro ao processar checkout completado:', error);
    }
  }

  /**
   * Tratar atualização de assinatura
   */
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    try {
      const clientId = subscription.metadata?.clientId;

      if (!clientId) {
        this.logger.warn('⚠️ ClientId não encontrado na assinatura');
        return;
      }

      this.logger.log(
        `✅ Assinatura atualizada para cliente: ${clientId} - Status: ${subscription.status}`,
      );

      // Determinar status baseado na assinatura
      let status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'SUSPENDED' = 'INACTIVE';

      if (subscription.status === 'active') {
        // Se está em trial, manter status TRIAL
        if (subscription.trial_end && new Date(subscription.trial_end * 1000) > new Date()) {
          status = 'TRIAL';
        } else {
          status = 'ACTIVE';
        }
      } else if (subscription.status === 'trialing') {
        status = 'TRIAL';
      } else if (subscription.status === 'past_due') {
        status = 'SUSPENDED';
      }

      // Calcular data de expiração
      const expiresAt = (subscription as any).current_period_end
        ? new Date((subscription as any).current_period_end * 1000)
        : null;

      // Extrair serviços selecionados se disponíveis
      let activeServices;
      try {
        activeServices = JSON.parse(subscription.metadata?.selectedServices || '[]');
      } catch (e) {
        // Manter serviços existentes se não conseguir parsear
        const client = await this.prisma.client.findUnique({
          where: { id: clientId },
          select: { activeServices: true },
        });
        activeServices = client?.activeServices || [];
      }

      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          status,
          plan: 'professional',
          expiresAt,
          activeServices,
        },
      });

      this.logger.log(`✅ Cliente atualizado: status=${status}, expiresAt=${expiresAt}`);
    } catch (error) {
      this.logger.error('❌ Erro ao processar atualização de assinatura:', error);
    }
  }

  /**
   * Tratar assinatura deletada
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      const clientId = subscription.metadata?.clientId;

      if (!clientId) {
        this.logger.warn('⚠️ ClientId não encontrado na assinatura');
        return;
      }

      this.logger.log(`❌ Assinatura deletada para cliente: ${clientId}`);

      // Remover todos os serviços ativos e downgrade para plano gratuito
      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          plan: 'basic',
          status: 'ACTIVE',
          activeServices: [], // Remover todos os serviços
          expiresAt: null,
        },
      });

      this.logger.log(`✅ Cliente desativado e serviços removidos`);
    } catch (error) {
      this.logger.error('❌ Erro ao processar assinatura deletada:', error);
    }
  }

  /**
   * Tratar pagamento bem-sucedido
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
      this.logger.log(`✅ Pagamento bem-sucedido: ${invoice.id}`);
      // Implementar lógica adicional se necessário
    } catch (error) {
      this.logger.error('❌ Erro ao processar pagamento bem-sucedido:', error);
    }
  }

  /**
   * Tratar falha no pagamento
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    try {
      this.logger.error(`❌ Falha no pagamento: ${invoice.id}`);
      // Implementar lógica de notificação ao cliente
    } catch (error) {
      this.logger.error('❌ Erro ao processar falha no pagamento:', error);
    }
  }
}
