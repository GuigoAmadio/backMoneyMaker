import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o ID do cliente/tenant da requisição
 */
export const Tenant = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  
  console.log('🔍 Tenant Decorator: Iniciando extração do clientId');
  console.log('🔍 Tenant Decorator: request.user:', request.user);
  console.log('🔍 Tenant Decorator: request.headers:', request.headers);

  // Prioridade: JWT > Header > Subdomínio
  let clientId = request.user?.clientId;
  console.log('🔍 Tenant Decorator: clientId do JWT:', clientId);

  if (!clientId) {
    clientId = request.headers['x-client-id'];
    console.log('🔍 Tenant Decorator: clientId do header:', clientId);
  }

  if (!clientId) {
    // Extrair do subdomínio (empresa.exemplo.com)
    const host = request.headers.host;
    console.log('🔍 Tenant Decorator: host:', host);
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      console.log('🔍 Tenant Decorator: subdomain:', subdomain);
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        // TODO: Buscar clientId pelo slug/subdomínio
        clientId = subdomain;
        console.log('🔍 Tenant Decorator: clientId do subdomain:', clientId);
      }
    }
  }
  
  console.log('🔍 Tenant Decorator: clientId final:', clientId);
  return clientId;
});

/**
 * Decorator para injetar dados completos do usuário autenticado
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
