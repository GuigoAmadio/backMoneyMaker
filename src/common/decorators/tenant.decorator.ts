import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o ID do cliente/tenant da requisição
 */
export const Tenant = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();

  // Prioridade: JWT > Header > Subdomínio
  let clientId = request.user?.clientId;

  if (!clientId) {
    clientId = request.headers['x-client-id'];
  }

  if (!clientId) {
    // Extrair do subdomínio (empresa.exemplo.com)
    const host = request.headers.host;
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        // TODO: Buscar clientId pelo slug/subdomínio
        clientId = subdomain;
      }
    }
  }
  console.log('clientId', clientId);
  return clientId;
});

/**
 * Decorator para injetar dados completos do usuário autenticado
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
