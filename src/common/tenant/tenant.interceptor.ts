import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';

interface RequestWithTenant {
  clientId?: string;
  headers: any;
  path: string;
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    try {
      // Pular verificação para rotas de health check e documentação
      if (this.shouldSkipTenantCheck(request.path)) {
        return next.handle();
      }

      let clientId: string | null = null;

      // 1. Tentar extrair do header x-client-id
      clientId = request.headers['x-client-id'] as string;

      // 2. Se não encontrar, tentar extrair do subdomínio
      if (!clientId) {
        const host = request.headers.host;
        if (host && host.includes('.')) {
          const subdomain = host.split('.')[0];
          if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
            // Buscar clientId pelo slug/subdomínio
            clientId = await this.tenantService.getClientIdBySlug(subdomain);
          }
        }
      }

      // 3. Se ainda não encontrar, verificar se é uma rota que requer tenant
      if (!clientId && this.requiresTenant(request.path)) {
        throw new BadRequestException(
          'Cliente não identificado. Forneça x-client-id no header ou use subdomínio válido',
        );
      }

      // Anexar clientId à requisição para uso posterior
      if (clientId) {
        request.clientId = clientId;
      }

      return next.handle();
    } catch (error) {
      throw error;
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
      '/api/v1/clients',
    ];

    return tenantRequiredPaths.some((tenantPath) => path.startsWith(tenantPath));
  }
}
