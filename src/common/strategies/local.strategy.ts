import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../modules/auth/auth.service'; // ← MUDOU AQUI

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const clientId = req.clientId;
    const user = await this.authService.validateUser(email, password, clientId);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }
}
