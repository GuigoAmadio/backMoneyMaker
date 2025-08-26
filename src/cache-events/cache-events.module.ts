import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheEventsController } from './cache-events.controller';
import { CacheEventsService } from './cache-events.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CacheEventsController],
  providers: [CacheEventsService],
  exports: [CacheEventsService], // Exportar para usar em outros módulos
})
export class CacheEventsModule {}
