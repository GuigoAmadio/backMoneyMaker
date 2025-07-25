import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Verificar se o clientId está presente no header
    const clientId = request.headers['client-id'] || request.headers['x-client-id'];

    if (!clientId) {
      return false;
    }

    // Adicionar o clientId à requisição para uso posterior
    request.clientId = clientId;

    return true;
  }
}
