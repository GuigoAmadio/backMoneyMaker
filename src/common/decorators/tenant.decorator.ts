import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

/**
 * Decorator para extrair o ID do cliente/tenant da requisição
 */
export const Tenant = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const logger = new Logger('TenantDecorator');

  logger.log('🔍 Tenant Decorator: Iniciando extração do clientId');
  logger.log('🔍 Tenant Decorator: request.user:', request.user);
  logger.log('🔍 Tenant Decorator: request.headers:', request.headers);

  // ========================================
  // 🔐 PRIORIDADE DE CLIENTID (COM IMPERSONATION)
  // ========================================
  // 1. impersonatedClientId (se SUPER_ADMIN estiver impersonando)
  // 2. x-client-id header (se SUPER_ADMIN enviou explicitamente)
  // 3. user.clientId (token JWT - comportamento padrão)
  // 4. client-id header (compatibilidade com código antigo)
  // 5. subdomain (fallback)
  // ========================================

  let clientId: string;

  // 1. Verificar se há impersonation (setada pelo JwtAuthGuard)
  if (request.user?.impersonatedClientId) {
    clientId = request.user.impersonatedClientId;
    logger.log('✅ Tenant Decorator: Usando impersonatedClientId:', clientId);
    logger.log(`🔄 IMPERSONATION ACTIVE: SUPER_ADMIN ${request.user.email} → Cliente ${clientId}`);
    return clientId;
  }

  // 2. Se for SUPER_ADMIN e enviou x-client-id, usar ele
  const requestedClientId = request.headers['x-client-id'];
  if (
    request.user?.role === 'SUPER_ADMIN' &&
    requestedClientId &&
    requestedClientId !== request.user?.clientId
  ) {
    clientId = requestedClientId;
    logger.warn(
      `🔄 Tenant Decorator: SUPER_ADMIN usando x-client-id: ${clientId} (original: ${request.user.clientId})`,
    );
    return clientId;
  }

  // 3. Usar clientId do JWT (comportamento padrão)
  clientId = request.user?.clientId;
  if (clientId) {
    logger.log('✅ Tenant Decorator: Usando clientId do JWT:', clientId);
    return clientId;
  }

  // 4. Fallback: x-client-id header (se não tiver user no JWT)
  if (requestedClientId) {
    clientId = requestedClientId;
    logger.log('⚠️ Tenant Decorator: Usando x-client-id do header (sem JWT):', clientId);
    return clientId;
  }


  // 6. Extrair do subdomínio (empresa.exemplo.com)
  const host = request.headers.host;
  logger.log('🔍 Tenant Decorator: host:', host);
  if (host && host.includes('.')) {
    const subdomain = host.split('.')[0];
    logger.log('🔍 Tenant Decorator: subdomain:', subdomain);
    if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
      clientId = subdomain;
      logger.log('⚠️ Tenant Decorator: clientId do subdomain:', clientId);
      return clientId;
    }
  }

  logger.warn('❌ Tenant Decorator: Nenhum clientId encontrado!');
  return null;
});

/**
 * Decorator para injetar dados completos do usuário autenticado
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
