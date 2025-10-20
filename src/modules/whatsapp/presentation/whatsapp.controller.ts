import { Controller, Post, Get, Body, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessIncomingMessageUseCase } from '../application/use-cases/process-incoming-message.use-case';
import { SendMessageUseCase } from '../application/use-cases/send-message.use-case';
import { ProcessMessageDto } from '../application/dtos/process-message.dto';
import { SendMessageDto } from '../application/dtos/send-message.dto';
import { ConfigService } from '@nestjs/config';

/**
 * Controller: WhatsApp
 * Endpoints para webhooks e envio de mensagens
 */
@ApiTags('WhatsApp')
@Controller({ path: 'whatsapp', version: '1' })
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);
  constructor(
    private readonly processIncomingMessageUseCase: ProcessIncomingMessageUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Webhook de verificação do WhatsApp (Meta)
   * GET: https://seu-dominio.com/api/v1/whatsapp/webhook
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Webhook de verificação (Meta WhatsApp)' })
  @ApiResponse({ status: 200, description: 'Verificação bem-sucedida' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ) {
    this.logger.log(`🔍 Verificação de webhook recebida`);

    const expectedToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('✅ Webhook verificado com sucesso');
      return challenge;
    }

    this.logger.warn('❌ Token de verificação inválido');
    throw new Error('Token de verificação inválido');
  }

  /**
   * Webhook para receber mensagens do WhatsApp (Meta)
   * POST: https://seu-dominio.com/api/v1/whatsapp/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receber mensagens do WhatsApp' })
  @ApiResponse({ status: 200, description: 'Mensagem processada' })
  async handleWebhook(@Body() body: any) {
    this.logger.log('📥 Webhook recebido');
    this.logger.debug(JSON.stringify(body, null, 2));

    try {
      // Estrutura do webhook do Meta WhatsApp
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Verificar se há mensagens
        if (value?.messages) {
          const message = value.messages[0];

          // Ignorar mensagens enviadas por você
          if (message.from === this.configService.get<string>('WHATSAPP_PHONE_NUMBER')) {
            return { status: 'ok', message: 'Mensagem própria ignorada' };
          }

          // Processar apenas mensagens de texto
          if (message.type === 'text') {
            const dto: ProcessMessageDto = {
              messageId: message.id,
              from: message.from,
              to: value.metadata.phone_number_id,
              content: message.text.body,
              timestamp: message.timestamp,
            };

            const result = await this.processIncomingMessageUseCase.execute(dto);

            // Se houve resposta, enviar de volta
            if (result.success && result.response) {
              await this.sendMessageUseCase.execute(
                {
                  to: message.from,
                  content: result.response,
                  replyToMessageId: message.id,
                },
                value.metadata.phone_number_id,
              );
            }
          }
        }

        // Verificar status de mensagens
        if (value?.statuses) {
          const status = value.statuses[0];
          this.logger.log(`📊 Status atualizado: ${status.id} -> ${status.status}`);
          // Aqui você pode atualizar o status no banco se necessário
        }
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar webhook: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Endpoint para enviar mensagem manualmente
   */
  @Post('send')
  @ApiOperation({ summary: 'Enviar mensagem para WhatsApp' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada' })
  async sendMessage(@Body() dto: SendMessageDto) {
    this.logger.log(`📤 Enviando mensagem manual para ${dto.to}`);

    const fromNumber = this.configService.get<string>('WHATSAPP_PHONE_NUMBER');
    const result = await this.sendMessageUseCase.execute(dto, fromNumber);

    return result;
  }

  /**
   * Endpoint de status/healthcheck
   */
  @Get('status')
  @ApiOperation({ summary: 'Verificar status do módulo WhatsApp' })
  async getStatus() {
    return {
      success: true,
      module: 'WhatsApp',
      status: 'online',
      timestamp: new Date().toISOString(),
      config: {
        phoneNumberId: !!this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID'),
        accessToken: !!this.configService.get<string>('WHATSAPP_ACCESS_TOKEN'),
        verifyToken: !!this.configService.get<string>('WHATSAPP_VERIFY_TOKEN'),
      },
    };
  }
}
