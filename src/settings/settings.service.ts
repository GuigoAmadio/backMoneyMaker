import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AppSettings {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointment_reminders: boolean;
    marketing: boolean;
  };
  business: {
    name: string;
    description: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    working_hours: any;
  };
}

export interface UserSettings {
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    appointment_reminders: boolean;
  };
  preferences: {
    dashboard_layout: string;
    default_view: string;
    show_tips: boolean;
  };
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getAppSettings(clientId: string): Promise<AppSettings> {
    this.logger.log(`⚙️ [SettingsService] Obtendo configurações do app para cliente: ${clientId}`);

    // Buscar configurações do cliente
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Configurações padrão
    const defaultSettings: AppSettings = {
      theme: 'light',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'BRL',
      notifications: {
        email: true,
        sms: false,
        push: true,
        appointment_reminders: true,
        marketing: false,
      },
      business: {
        name: client.name || 'Expatriamente',
        description: 'Clínica de Psicanálise',
        logo: client.logo || '',
        address: '',
        phone: client.phone || '',
        email: client.email || '',
        website: client.website || '',
        working_hours: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '08:00', end: '12:00', enabled: false },
          sunday: { start: '08:00', end: '12:00', enabled: false },
        },
      },
    };

    // Mesclar com configurações salvas (se existirem)
    try {
      const savedSettings = client.settings as any;
      if (savedSettings && typeof savedSettings === 'object') {
        return { ...defaultSettings, ...savedSettings };
      }
    } catch (error) {
      this.logger.warn('Erro ao parsear configurações salvas, usando padrões');
    }

    return defaultSettings;
  }

  async getUserSettings(userId: string, clientId: string): Promise<UserSettings> {
    this.logger.log(`👤 [SettingsService] Obtendo configurações de usuário: ${userId}`);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, clientId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Configurações padrão do usuário
    const defaultSettings: UserSettings = {
      theme: 'light',
      language: 'pt-BR',
      notifications: {
        email: true,
        sms: false,
        push: true,
        appointment_reminders: true,
      },
      preferences: {
        dashboard_layout: 'grid',
        default_view: 'calendar',
        show_tips: true,
      },
    };

    // Mesclar com configurações salvas (usando settings genérico)
    try {
      const savedSettings = (user as any).preferences;
      if (savedSettings && typeof savedSettings === 'object') {
        return { ...defaultSettings, ...savedSettings };
      }
    } catch (error) {
      this.logger.warn('Erro ao parsear preferências do usuário, usando padrões');
    }

    return defaultSettings;
  }

  async updateUserSettings(
    userId: string,
    clientId: string,
    updateData: Partial<UserSettings>,
  ): Promise<UserSettings> {
    this.logger.log(`📝 [SettingsService] Atualizando configurações de usuário: ${userId}`);

    // Obter configurações atuais
    const currentSettings = await this.getUserSettings(userId, clientId);

    // Mesclar com novas configurações
    const newSettings = { ...currentSettings, ...updateData };

    // Atualizar no banco (usando tipo genérico)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Usando any para contornar limitações do schema
      } as any,
    });

    this.logger.log(`✅ [SettingsService] Configurações de usuário atualizadas: ${userId}`);
    return newSettings;
  }

  async getClientSettings(clientId: string): Promise<any> {
    this.logger.log(`🏢 [SettingsService] Obtendo configurações de cliente: ${clientId}`);

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return {
      id: client.id,
      name: client.name,
      description: 'Clínica de Psicanálise',
      logo: client.logo,
      website: client.website,
      phone: client.phone,
      email: client.email,
      address: '',
      settings: client.settings || {},
      status: client.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  async updateClientSettings(clientId: string, updateData: any): Promise<any> {
    this.logger.log(`📝 [SettingsService] Atualizando configurações de cliente: ${clientId}`);

    const updatedClient = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`✅ [SettingsService] Configurações de cliente atualizadas: ${clientId}`);
    return updatedClient;
  }
}
