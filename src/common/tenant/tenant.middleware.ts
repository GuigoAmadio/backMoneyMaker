import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

interface RequestWithTenant extends Request {
  clientId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    try {
      // Pular verificação para rotas de health check e documentação
      if (this.shouldSkipTenantCheck(req.path)) {
        return next();
      }

      let clientId: string | null = null;

      // 1. Tentar extrair do header x-client-id
      clientId = req.headers['x-client-id'] as string;

      // 2. Se não encontrar, tentar extrair do subdomínio
      if (!clientId) {
        const host = req.headers.host;
        if (host && host.includes('.')) {
          const subdomain = host.split('.')[0];
          if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
            // Buscar clientId pelo slug/subdomínio
            clientId = await this.tenantService.getClientIdBySlug(subdomain);
          }
        }
      }

      // 3. Se ainda não encontrar, verificar se é uma rota que requer tenant
      if (!clientId && this.requiresTenant(req.path)) {
        throw new BadRequestException(
          'Cliente não identificado. Forneça x-client-id no header ou use subdomínio válido',
        );
      }

      // Anexar clientId à requisição para uso posterior
      if (clientId) {
        req.clientId = clientId;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  private shouldSkipTenantCheck(path: string): boolean {
    const skipPaths = ['/api/health', '/api/docs', '/api', '/', '/health'];

    return skipPaths.some((skipPath) => path.startsWith(skipPath));
  }

  private requiresTenant(path: string): boolean {
    // Rotas que requerem identificação do tenant
    const tenantRequiredPaths = [
      '/api/v1/users',
      '/api/v1/appointments',
      '/api/v1/orders',
      '/api/v1/products',
      '/api/v1/dashboard',
    ];

    return tenantRequiredPaths.some((tenantPath) => path.startsWith(tenantPath));
  }
}
