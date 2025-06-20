import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Agendamentos')
@Controller({ path: 'appointments', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiSecurity('client-id')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Tenant() clientId: string) {
    return this.appointmentsService.findAll(clientId);
  }
} 