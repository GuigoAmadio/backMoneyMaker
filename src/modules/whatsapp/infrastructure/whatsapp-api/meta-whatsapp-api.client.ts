import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppApiClient } from './whatsapp-api-client.interface';
import axios, { AxiosInstance } from 'axios';

/**
 * Implementação: Meta WhatsApp Business API
 * Cliente para comunicação com a API oficial do WhatsApp (Meta/Facebook)
 */
@Injectable()
export class MetaWhatsAppApiClient implements IWhatsAppApiClient {
  private readonly logger = new Logger(MetaWhatsAppApiClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string = 'v18.0';

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    const baseURL = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;

    this.httpClient = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger.log('✅ Meta WhatsApp API Client inicializado');
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage(data: {
    to: string;
    message: string;
    replyToMessageId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.logger.log(`📤 Enviando mensagem para ${data.to}`);

      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: data.to,
        type: 'text',
        text: {
          preview_url: false,
          body: data.message,
        },
      };

      // Adicionar contexto de resposta se fornecido
      if (data.replyToMessageId) {
        payload.context = {
          message_id: data.replyToMessageId,
        };
      }

      const response = await this.httpClient.post('/messages', payload);

      this.logger.log(`✅ Mensagem enviada com sucesso: ${response.data.messages[0].id}`);

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagem: ${error.response?.data?.error?.message || error.message}`,
      );

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Enviar mensagem com template
   * Templates precisam ser pré-aprovados no Business Manager do Meta
   */
  async sendTemplate(data: {
    to: string;
    templateName: string;
    templateParams?: Record<string, string>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.logger.log(`📤 Enviando template "${data.templateName}" para ${data.to}`);

      const components = [];

      // Adicionar parâmetros se fornecidos
      if (data.templateParams) {
        const parameters = Object.values(data.templateParams).map((value) => ({
          type: 'text',
          text: value,
        }));

        components.push({
          type: 'body',
          parameters,
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: data.to,
        type: 'template',
        template: {
          name: data.templateName,
          language: {
            code: 'pt_BR',
          },
          components,
        },
      };

      const response = await this.httpClient.post('/messages', payload);

      this.logger.log(`✅ Template enviado com sucesso: ${response.data.messages[0].id}`);

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar template: ${error.response?.data?.error?.message || error.message}`,
      );

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Marcar mensagem como lida
   */
  async markAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await this.httpClient.post('/messages', payload);

      this.logger.log(`✅ Mensagem marcada como lida: ${messageId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Erro ao marcar como lida: ${error.message}`);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verificar status de uma mensagem
   */
  async getMessageStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      // A API do WhatsApp não tem endpoint direto para consultar status
      // O status vem via webhooks
      this.logger.warn('getMessageStatus não implementado - use webhooks para status');

      return {
        status: 'unknown',
        error: 'Status disponível apenas via webhooks',
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
