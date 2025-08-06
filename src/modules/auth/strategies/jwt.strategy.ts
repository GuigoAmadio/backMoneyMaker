import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';

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
    this.logger.log(`JWT_SECRET configurado: ${jwtSecret ? 'SIM' : 'NÃO'}`);
  }

  async validate(payload: JwtPayload) {
    this.logger.log('JwtStrategy.validate iniciado');
    this.logger.log(`Payload recebido: ${JSON.stringify(payload)}`);

    if (!payload || !payload.sub) {
      this.logger.error('Token JWT inválido: campo sub ausente');
      throw new UnauthorizedException('Token JWT inválido: campo sub ausente');
    }

    this.logger.log(`Buscando usuário com ID: ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        client: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    this.logger.log(`Usuário encontrado: ${user ? 'SIM' : 'NÃO'}`);

    if (!user) {
      this.logger.error(`Usuário não encontrado para ID: ${payload.sub}`);
      throw new UnauthorizedException('Usuário não encontrado');
    }

    this.logger.log(`Status do usuário: ${user.status}`);
    if (user.status !== 'ACTIVE') {
      this.logger.error(`Usuário inativo: ${user.id}`);
      throw new UnauthorizedException('Usuário inativo');
    }

    this.logger.log(`Status do cliente: ${user.client?.status}`);
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
