import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Executar autenticação JWT padrão
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar se o usuário tem acesso ao tenant correto
    if (request.clientId && user.clientId !== request.clientId) {
      throw new ForbiddenException('Acesso negado ao recurso deste cliente');
    }

    // Verificar se o cliente ainda está ativo
    if (user.clientId) {
      const isClientValid = await this.tenantService.validateClient(user.clientId);
      if (!isClientValid) {
        throw new ForbiddenException('Cliente inativo ou com assinatura expirada');
      }
    }

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
}
