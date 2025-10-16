import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Stripe')
@Controller({ path: 'stripe', version: '1' })
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Public()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Criar sessão de checkout do Stripe' })
  @ApiResponse({
    status: 201,
    description: 'Sessão criada com sucesso',
  })
  async createCheckoutSession(@Body() dto: CreateCheckoutSessionDto, @Tenant() clientId: string) {
    this.logger.log(`📝 Criando sessão de checkout para cliente: ${clientId}`);

    try {
      const result = await this.stripeService.createCheckoutSession(dto, clientId);

      return {
        success: true,
        data: result,
        message: 'Sessão criada com sucesso',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar sessão:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('subscription')
  @ApiOperation({ summary: 'Buscar assinatura do cliente' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura retornada com sucesso',
  })
  async getSubscription(@Tenant() clientId: string) {
    this.logger.log(`📝 Buscando assinatura para cliente: ${clientId}`);

    try {
      const subscription = await this.stripeService.getSubscription(clientId);

      return {
        success: true,
        data: subscription,
        message: 'Assinatura retornada com sucesso',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar assinatura:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('cancel-subscription')
  @ApiOperation({ summary: 'Cancelar assinatura' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura cancelada com sucesso',
  })
  async cancelSubscription(@Tenant() clientId: string) {
    this.logger.log(`📝 Cancelando assinatura para cliente: ${clientId}`);

    try {
      const result = await this.stripeService.cancelSubscription(clientId);

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('reactivate-subscription')
  @ApiOperation({ summary: 'Reativar assinatura' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura reativada com sucesso',
  })
  async reactivateSubscription(@Tenant() clientId: string) {
    this.logger.log(`📝 Reativando assinatura para cliente: ${clientId}`);

    try {
      const result = await this.stripeService.reactivateSubscription(clientId);

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao reativar assinatura:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('customer-portal')
  @ApiOperation({ summary: 'Criar portal do cliente Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Portal criado com sucesso',
  })
  async createCustomerPortal(@Tenant() clientId: string) {
    this.logger.log(`📝 Criando portal para cliente: ${clientId}`);

    try {
      const result = await this.stripeService.createCustomerPortal(clientId);

      return {
        success: true,
        data: result,
        message: 'Portal criado com sucesso',
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar portal:', error);
      throw error;
    }
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook do Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processado com sucesso',
  })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    this.logger.log('📨 Webhook recebido do Stripe');

    try {
      const result = await this.stripeService.handleWebhook(signature, request.rawBody);

      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }
}
