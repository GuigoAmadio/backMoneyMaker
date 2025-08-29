import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    this.logger.log(`=== TenantInterceptor: Processando requisição ${request.path} ===`);

    try {
      // Pular verificação para rotas de health check e documentação
      if (this.shouldSkipTenantCheck(request.path)) {
        this.logger.log(`=== TenantInterceptor: Pulando verificação para ${request.path} ===`);
        return next.handle();
      }

      let clientId: string | null = null;

      // 1. Tentar extrair do header x-client-id
      clientId = request.headers['x-client-id'] as string;
      this.logger.log(`=== TenantInterceptor: clientId do header: ${clientId} ===`);

      // 2. Se não encontrar, tentar extrair do subdomínio
      if (!clientId) {
        const host = request.headers.host;
        this.logger.log(`=== TenantInterceptor: host: ${host} ===`);
        if (host && host.includes('.')) {
          const subdomain = host.split('.')[0];
          this.logger.log(`=== TenantInterceptor: subdomain: ${subdomain} ===`);
          if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
            // Buscar clientId pelo slug/subdomínio
            clientId = await this.tenantService.getClientIdBySlug(subdomain);
            this.logger.log(`=== TenantInterceptor: clientId do subdomain: ${clientId} ===`);
          }
        }
      }

      // 3. Se ainda não encontrar, verificar se é uma rota que requer tenant
      if (!clientId && this.requiresTenant(request.path)) {
        this.logger.error(
          `=== TenantInterceptor: Cliente não identificado para ${request.path} ===`,
        );
        throw new BadRequestException(
          'Cliente não identificado. Forneça x-client-id no header ou use subdomínio válido',
        );
      }

      // Anexar clientId à requisição para uso posterior
      if (clientId) {
        request.clientId = clientId;
        this.logger.log(`=== TenantInterceptor: clientId anexado: ${clientId} ===`);
      }

      this.logger.log(`=== TenantInterceptor: Requisição processada com sucesso ===`);
      return next.handle();
    } catch (error) {
      this.logger.error(`=== TenantInterceptor: Erro ao processar requisição ===`, error);
      throw error;
    }
  }

  private shouldSkipTenantCheck(path: string): boolean {
    const skipPaths = [
      '/api/health',
      '/api/docs',
      '/api',
      '/',
      '/health',
      '/metrics',
      '/api/v1/notifications/telegram/public',
    ];

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
      '/api/v1/cache-events/stream',
    ];

    return tenantRequiredPaths.some((tenantPath) => path.startsWith(tenantPath));
  }
}
