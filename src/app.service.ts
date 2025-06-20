import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): object {
    return {
      message: 'MoneyMaker Backend API está funcionando!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
    };
  }

  getHealth(): object {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutos`,
      environment: this.configService.get('NODE_ENV'),
      version: '1.0.0',
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      },
      database: {
        status: 'connected', // TODO: Implementar verificação real
        provider: 'PostgreSQL',
      },
      api: {
        version: this.configService.get('API_VERSION') || 'v1',
        docs: '/api/docs',
      },
    };
  }
} 