import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  clientId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    this.logger.log('JwtStrategy sendo inicializada');
  }

  /**
   * O método `validate` é chamado automaticamente pelo Passport-JWT sempre que um token JWT válido é apresentado.
   * Ele recebe como argumento o "payload" já decodificado do token, e é responsável por VALIDAR e ENRIQUECER os dados do usuário.
   *
   * Este método serve para dois principais propósitos:
   * 1. Verificar se o usuário do token realmente existe no banco de dados (e se está ativo).
   * 2. Retornar o objeto de usuário que será anexado em `request.user` nos controllers/provides seguintes.
   */
  async validate(payload: JwtPayload) {
    /**
     * Como é o formato desse payload?
     *
     * O payload do JWT é definido no momento em que você gera o token no AuthService (normalmente na função de login, usando jwt.sign(payload)).
     *
     * O formato exato é definido por você. No nosso caso, ele é representado pela interface JwtPayload, definida no topo deste arquivo:
     *
     * interface JwtPayload {
     *   sub: string;     // ID único do usuário
     *   email: string;   // Email do usuário
     *   role: string;    // Papel (admin, user, etc)
     *   clientId: string;// ID do cliente/tenant do usuário
     * }
     *
     * Ou seja: quem gera o token (AuthService) define os campos do payload, e este método 'validate' recebe o payload decodificado.
     */

    this.logger.log(`Payload recebido (formato JwtPayload): ${JSON.stringify(payload)}`);

    /**
     * Checa se o payload existe e se contém o campo 'sub' (identificador único do usuário).
     * Se não houver esse campo, provavelmente o token está corrompido ou malformado.
     * Nesse caso, lançamos uma exceção Unathorized automaticamente - o NestJS vai retornar 401.
     */
    if (!payload || !payload.sub) {
      this.logger.error('Token JWT inválido: campo sub ausente');
      throw new UnauthorizedException('Token JWT inválido: campo sub ausente');
    }

    /**
     * Busca o usuário no banco de dados pelo ID atribuído ao campo 'sub' do payload JWT.
     * O 'sub' geralmente é o id do usuário, definido na geração do token.
     * Aqui, também buscamos informações do "cliente" (tenant) ao qual o usuário pertence.
     */
    this.logger.log(`Buscando usuário com ID: ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        client: {
          select: { id: true, name: true, status: true, activeServices: true },
        },
      },
    });

    /**
     * Se não encontrar o usuário (talvez ele tenha sido deletado), recusa a autenticação.
     */
    this.logger.log(`Usuário encontrado: ${user ? 'SIM' : 'NÃO'}`);

    if (!user) {
      this.logger.error(`Usuário não encontrado para ID: ${payload.sub}`);
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      this.logger.error(`Usuário inativo: ${user.id}`);
      throw new UnauthorizedException('Usuário inativo');
    }

    if (user.client?.status !== 'ACTIVE') {
      this.logger.error(`Cliente inativo: ${user.client?.id}`);
      throw new UnauthorizedException('Cliente inativo');
    }

    const { password: _, ...userWithoutPassword } = user;

    this.logger.log(
      `Usuário validado com sucesso: ${user.id} (${user.email}) - Role: ${user.role} - ClientId: ${user.clientId}`,
    );

    return userWithoutPassword;
  }
}
