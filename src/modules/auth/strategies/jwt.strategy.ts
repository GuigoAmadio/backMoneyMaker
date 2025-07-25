import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // LOG para debug
    console.log('[JwtStrategy] Payload recebido:', payload);
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT inválido: campo sub ausente');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        client: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    // LOG para debug

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (user.client.status !== 'ACTIVE') {
      throw new UnauthorizedException('Cliente inativo');
    }

    const { password: _, ...userWithoutPassword } = user;
    // LOG para debug
    return userWithoutPassword;
  }
}
