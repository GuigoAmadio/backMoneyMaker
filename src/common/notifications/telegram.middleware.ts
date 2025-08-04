import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramSecurityMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Verificar origem da requisição
    const allowedOrigins =
      this.configService.get<string>('TELEGRAM_ALLOWED_ORIGINS')?.split(',') || [];
    const origin = req.get('Origin');

    // Se não há origens permitidas configuradas, permitir todas
    if (allowedOrigins.length === 0) {
      return next();
    }

    if (origin && !allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origem não permitida para endpoints do Telegram');
    }

    // Verificar se é uma requisição para endpoints públicos do Telegram
    if (req.path.includes('/notifications/telegram/public/')) {
      // Adicionar headers de segurança
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Log da requisição para auditoria
      console.log(`Telegram Public Endpoint: ${req.method} ${req.path} from ${req.ip}`);
    }

    next();
  }
}
