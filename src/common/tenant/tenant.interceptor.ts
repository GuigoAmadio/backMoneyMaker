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

/**
 * A interface RequestWithTenant define as propriedades opcionais que podemos adicionar dinamicamente
 * ao objeto de request durante o processamento (como clientId e userId).
 *
 * Ao tipar getRequest<RequestWithTenant>(), informamos ao TypeScript que, a partir deste ponto,
 * o objeto request pode ter essas propriedades, mesmo que não estejam presentes originalmente
 * no tipo do Express.Request. Isso serve apenas para autocomplete e checagem de tipos.
 *
 * Se você quiser acessar request.userId em outros lugares do seu código (por exemplo, em outros
 * interceptors, guards, controllers, etc), basta tipar o request como RequestWithTenant (ou estender
 * o tipo Express.Request com essas propriedades opcionais). Não é obrigatório definir em todos os lugares,
 * mas se quiser autocomplete/checagem de tipos, pode criar um tipo global ou usar interface de extensão.
 */
interface RequestWithTenant {
  clientId?: string; // Adicionado dinamicamente pelo interceptor
  userId?: string; // Adicionado dinamicamente pelo interceptor
  xClientId?: string; // Adicionado dinamicamente pelo interceptor
  user?: {
    // ✅ ADICIONAR ISSO
    id: string;
    email: string;
    role: string;
    clientId: string;
    impersonatedClientId?: string;
  };
  headers: any; // Sempre presente no Express.Request
  path: string; // Sempre presente no Express.Request
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    /**
     * A partir deste ponto, request pode ter userId/clientId, pois tipamos como RequestWithTenant.
     * Se você quiser garantir isso em outros arquivos, basta usar o mesmo tipo/interface.
     */
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    this.logger.log(`=== TenantInterceptor: Processando requisição ${request.path} ===`);

    try {
      // Pular verificação para rotas que não precisam de tenant
      if (this.shouldSkipTenantCheck(request.path)) {
        this.logger.log(`🔓 === TenantInterceptor: PULANDO tenant check para ${request.path} ===`);
        return next.handle();
      }

      // Extrair userId do header (se houver)
      const userId = request.headers['x-user-id'] as string;
      if (userId) {
        request.userId = userId;
      }

      // ========================================
      // 🔐 EXTRAÇÃO DO CLIENTID (ORDEM CORRETA DE PRIORIDADE)
      // ========================================
      let clientId: string | null = null;

      // 1️⃣ PRIORIDADE MÁXIMA: clientId do JWT (se usuário autenticado)
      //    O JwtAuthGuard já validou tudo, inclusive impersonation de SUPER_ADMIN
      if (request.clientId) {
        clientId = request.clientId;
        this.logger.log(
          `✅ TenantInterceptor: Usando clientId do Toekn AuthGuard (usuário autenticado): ${clientId}`,
        );
      }
      // 2️⃣ FALLBACK: header x-client-id (apenas para rotas públicas sem JWT)
      //    Usado em: registro via convite, ou login com clientId específico
      else if (request.headers['x-client-id']) {
        clientId = request.headers['x-client-id'] as string;
        this.logger.log(
          `⚠️ TenantInterceptor: Usando clientId do x-client-id (AuthGuard pelo jeito nao foi completado): ${clientId}`,
        );
      }

      // 3️⃣ Se requer tenant e não encontrou, bloquear
      if (this.requiresTenant(request.path) && !clientId) {
        this.logger.error(`❌ TenantInterceptor: Cliente não identificado para ${request.path}`);
        throw new BadRequestException(
          'Cliente não identificado. Forneça token válido ou x-client-id no header',
        );
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
      '/api/v1/health',
      '/api/v1/docs',
      '/metrics',
      '/api/v1/notifications/telegram/public',
      '/api/v1/auth/register', // Deixar service validar clientId
      '/api/v1/auth/login', // Deixar service validar clientId
      '/api/v1/auth/refresh', // Não precisa de clientId
      '/api/v1/auth/logout', // Não precisa de clientId
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
      '/api/v1/schedules',
      '/api/v1/cache-events/stream',
      '/api/v1/finances',
    ];

    return tenantRequiredPaths.some((tenantPath) => path.startsWith(tenantPath));
  }
}
