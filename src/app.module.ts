import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
