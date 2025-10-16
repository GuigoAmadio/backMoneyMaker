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
    // Aqui, chamamos o método canActivate da classe AuthGuard('jwt'), que é a implementação padrão do Passport para autenticação JWT no NestJS.
    // O que acontece "por baixo dos panos" é:
    // 1. O método super.canActivate(context) chama internamente o método handleRequest, que por sua vez executa a estratégia 'jwt' registrada no Passport.
    // 2. A estratégia 'jwt' extrai o token JWT do header Authorization (Bearer token), valida a assinatura e decodifica o payload.
    // 3. Se o token for válido, o usuário decodificado é anexado ao objeto request (request.user).
    // 4. Se o token for inválido, expirado ou ausente, uma exceção UnauthorizedException é lançada automaticamente.
    // Ou seja, essa linha faz toda a mágica de autenticação JWT, validação do token e injeção do usuário na request.
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      this.logger.error('=== JwtAuthGuard: Autenticação JWT falhou ===');
      return false;
    }
    // Sim! Aqui o user já está completamente preenchido porque o método validate() da JwtStrategy
    // (em strategies/jwt.strategy.ts) já foi executado e devolveu o user do banco de dados
    // (exceto o campo senha), com todas as propriedades que precisamos.
    //
    // O Passport vai rodar JwtStrategy.validate(payload), pegar o retorno desse método
    // e colocar em request.user automaticamente ANTES de entrar aqui.
    //
    // Por isso, aqui podemos acessar request.user imediatamente, sem precisar decodificar nada.
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.log(
      `=== JwtAuthGuard: Usuário decodificado: ${user?.id}, sub: ${user?.sub}, (${user?.email}) - Role: ${user?.role} - ClientId: ${user?.clientId} ===`,
    );

    // ========================================
    // 🔐 LÓGICA DE IMPERSONATION PARA SUPER_ADMIN
    // ========================================
    const requestedClientId = request.headers['x-client-id'];
    request.xClientId = requestedClientId;

    // Se o usuário é SUPER_ADMIN e está enviando um x-client-id diferente
    if (user.role === 'SUPER_ADMIN' && requestedClientId && requestedClientId !== user.clientId) {
      this.logger.warn(
        `🔄 IMPERSONATION: SUPER_ADMIN ${user.email} (${user.clientId}) está acessando cliente ${requestedClientId}`,
      );

      // Validar se o cliente alvo existe e está ativo
      const isTargetClientValid = await this.tenantService.validateClient(requestedClientId);

      if (!isTargetClientValid) {
        this.logger.error(
          `❌ IMPERSONATION FAILED: Cliente alvo ${requestedClientId} não existe ou está inativo`,
        );
        throw new ForbiddenException('Cliente alvo não existe ou está inativo');
      }

      // ✅ PERMITIR IMPERSONATION
      request.user.originalClientId = user.clientId; // Guardar o original
      request.user.impersonatedClientId = requestedClientId; // Marcar impersonation
      request.clientId = requestedClientId; // Sobrescrever para os controllers

      this.logger.log(
        `✅ IMPERSONATION ALLOWED: Sobrescrevendo clientId de ${user.clientId} para ${requestedClientId}`,
      );

      // Pular as validações normais de tenant (já validamos acima)
      return true;
    } else {
      request.clientId = request.user.clientId;
    }

    // ========================================
    // 🔐 VALIDAÇÃO NORMAL (Sem Impersonation)
    // ========================================

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

    /**
     * O método handleRequest é chamado automaticamente pelo Passport (e pelo AuthGuard do NestJS)
     * após a estratégia de autenticação (no caso, JWT) ser executada.
     *
     * O fluxo é assim:
     * 1. O método canActivate do AuthGuard chama a estratégia de autenticação (validate, etc).
     * 2. Quando a estratégia termina, o Passport chama handleRequest passando:
     *    - err: erro ocorrido na autenticação (se houver)
     *    - user: usuário decodificado do token (se válido)
     *    - info: informações adicionais (ex: motivo da falha)
     *
     * Você pode customizar handleRequest para lançar exceções customizadas, logar, etc.
     *
     * Ou seja: você NÃO chama handleRequest manualmente. Ele é chamado pelo fluxo do Passport.
     */
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
