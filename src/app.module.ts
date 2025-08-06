import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './common/tenant/tenant.module';

// Módulos de domínio
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './common/logger/logger.interceptor';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsInterceptor } from './common/metrics/metrics.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { TelegramModule } from './common/notifications/telegram.module';
import { CacheModule } from './common/cache/cache.module';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './modules/auth/strategies/jwt.strategy';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { TelegramSecurityMiddleware } from './common/notifications/telegram.middleware';

@Module({
  imports: [
    // Configurações
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL) || 60000,
          limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
        },
      ],
    }),

    // Database
    DatabaseModule,

    // Multi-tenancy
    TenantModule,

    // Passport
    PassportModule,

    // JWT
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),

    // Módulos de domínio
    AuthModule,
    UsersModule,
    ClientsModule,
    EmployeesModule,
    ServicesModule,
    AppointmentsModule,
    OrdersModule,
    ProductsModule,
    DashboardModule,
    PropertiesModule,

    // Ecommerce
    EcommerceModule,
    MetricsModule,
    TelegramModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtAuthGuard,
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
    consumer.apply(TelegramSecurityMiddleware).forRoutes('notifications/telegram/public/*');
  }
}
