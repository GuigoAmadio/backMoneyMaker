import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { DatabaseModule } from '../../../database/database.module';
import { TenantModule } from '../../../common/tenant/tenant.module';
import { CacheModule } from '../../../common/cache/cache.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    CacheModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
