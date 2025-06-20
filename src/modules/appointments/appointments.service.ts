import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implementar CRUD de agendamentos
  async findAll(clientId: string) {
    return this.prisma.appointment.findMany({
      where: { clientId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true, position: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }
} 