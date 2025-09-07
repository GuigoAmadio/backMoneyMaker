import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('=== JwtAuthGuard: Iniciando verificação de autenticação ===');

    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log('=== JwtAuthGuard: Rota pública, permitindo acesso ===');
      return true;
    }

    // Executar autenticação JWT padrão
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      this.logger.error('=== JwtAuthGuard: Autenticação JWT falhou ===');
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.log(
      `=== JwtAuthGuard: Usuário decodificado: ${user?.id}, sub: ${user?.sub}, (${user?.email}) - Role: ${user?.role} - ClientId: ${user?.clientId} ===`,
    );

    // Verificar se o usuário tem acesso ao tenant correto
    if (request.clientId && user.clientId !== request.clientId) {
      this.logger.error('=== JwtAuthGuard: Acesso negado - clientId não corresponde ===');
      throw new ForbiddenException('Acesso negado ao recurso deste cliente');
    }

    // Verificar se o cliente ainda está ativo
    if (user.clientId) {
      const isClientValid = await this.tenantService.validateClient(user.clientId);
      this.logger.log(`=== JwtAuthGuard: Cliente válido? ${isClientValid} ===`);

      if (!isClientValid) {
        this.logger.error('=== JwtAuthGuard: Cliente inativo ou assinatura expirada ===');
        throw new ForbiddenException('Cliente inativo ou com assinatura expirada');
      }
    }

    this.logger.log(
      `=== JwtAuthGuard: Acesso permitido, indo para controller, usuário COMPLETOOOOOOOOOO: ${JSON.stringify(user)}`,
    );
    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    this.logger.log('JwtAuthGuard.handleRequest executado');

    if (err) {
      this.logger.error(`Erro no handleRequest: ${err.message}`, err.stack);
    }

    if (user) {
      this.logger.log(`Usuário decodificado no handleRequest: ${user.id} (${user.email})`);
    }

    if (info) {
      this.logger.log(`Info do Passport: ${info}`);
    }

    if (err || !user) {
      this.logger.error('Token inválido ou expirado');
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
}
