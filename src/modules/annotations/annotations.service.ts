import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface Requester {
  userId: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'GUEST';
}

@Injectable()
export class AnnotationsService {
  constructor(private prisma: PrismaService) {}

  private async ensureEmployeeRelation(
    clientId: string,
    requester?: Requester,
    targetUserId?: string,
  ) {
    if (!requester || requester.role !== 'EMPLOYEE' || !targetUserId) return;

    const employee = await this.prisma.employee.findFirst({
      where: { userId: requester.userId },
      select: { id: true },
    });
    const employeeId = employee?.id;
    if (!employeeId) throw new ForbiddenException('Funcionário não associado corretamente');

    const hasRelation = await this.prisma.appointment.findFirst({
      where: { clientId, employeeId, userId: targetUserId },
      select: { id: true },
    });
    if (!hasRelation) throw new ForbiddenException('Sem vínculo com este cliente');
  }

  async list(params: {
    clientId: string;
    userId: string;
    appointmentId?: string;
    page: number;
    limit: number;
    requester?: Requester;
  }) {
    const { clientId, userId, appointmentId, page, limit, requester } = params;

    // Regras de acesso
    if (requester?.role === 'EMPLOYEE') {
      await this.ensureEmployeeRelation(clientId, requester, userId);
    }

    // Filtro de visibilidade por role
    const where: any = { clientId, userId };
    if (appointmentId) where.appointmentId = appointmentId;

    if (requester?.role === 'CLIENT') {
      // Cliente vê notas compartilhadas ou próprias
      where.OR = [{ visibility: 'SHARED_WITH_CLIENT' }, { createdById: requester.userId }];
    }

    const [items, total] = await Promise.all([
      this.prisma.annotation.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.annotation.count({ where }),
    ]);

    return {
      success: true,
      data: {
        data: items,
        meta: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrevious: page > 1,
        },
      },
    };
  }

  async create(params: {
    clientId: string;
    userId: string;
    appointmentId?: string;
    content: string;
    visibility?: 'PRIVATE_TO_EMPLOYEE' | 'SHARED_WITH_CLIENT';
    requester?: Requester;
  }) {
    const { clientId, userId, appointmentId, content, visibility, requester } = params;
    if (!content || content.trim().length === 0)
      throw new BadRequestException('Conteúdo obrigatório');

    if (!requester) throw new ForbiddenException('Não autenticado');

    // Se EMPLOYEE, validar vínculo
    if (requester.role === 'EMPLOYEE') {
      await this.ensureEmployeeRelation(clientId, requester, userId);
    }

    // Se CLIENT, restringir visibilidade a SHARED_WITH_CLIENT
    const finalVisibility =
      requester.role === 'CLIENT' ? 'SHARED_WITH_CLIENT' : visibility || 'PRIVATE_TO_EMPLOYEE';

    const annotation = await this.prisma.annotation.create({
      data: {
        clientId,
        userId,
        appointmentId,
        content: content.trim(),
        visibility: finalVisibility as any,
        createdById: requester.userId,
        createdByRole: requester.role as any,
        employeeId:
          requester.role === 'EMPLOYEE'
            ? (
                await this.prisma.employee.findFirst({
                  where: { userId: requester.userId },
                  select: { id: true },
                })
              )?.id
            : null,
      },
    });

    return { success: true, data: { data: annotation } };
  }

  async update(params: {
    id: string;
    clientId: string;
    content?: string;
    visibility?: 'PRIVATE_TO_EMPLOYEE' | 'SHARED_WITH_CLIENT';
    isPinned?: boolean;
    requester?: Requester;
  }) {
    const { id, clientId, content, visibility, isPinned, requester } = params;
    if (!requester) throw new ForbiddenException('Não autenticado');

    const existing = await this.prisma.annotation.findFirst({ where: { id, clientId } });
    if (!existing) throw new NotFoundException('Anotação não encontrada');

    // Regras: EMPLOYEE com vínculo pode editar todas; CLIENT só se criou
    if (requester.role === 'EMPLOYEE') {
      await this.ensureEmployeeRelation(clientId, requester, existing.userId);
    } else if (requester.role === 'CLIENT') {
      if (existing.createdById !== requester.userId) throw new ForbiddenException('Sem permissão');
    }

    // CLIENT não pode tornar PRIVATE
    const finalVisibility = requester.role === 'CLIENT' ? 'SHARED_WITH_CLIENT' : visibility;

    const updated = await this.prisma.annotation.update({
      where: { id },
      data: {
        ...(typeof content === 'string' ? { content: content.trim() } : {}),
        ...(finalVisibility ? { visibility: finalVisibility as any } : {}),
        ...(typeof isPinned === 'boolean' ? { isPinned } : {}),
      },
    });

    return { success: true, data: { data: updated } };
  }

  async remove(params: { id: string; clientId: string; requester?: Requester }) {
    const { id, clientId, requester } = params;
    if (!requester) throw new ForbiddenException('Não autenticado');

    const existing = await this.prisma.annotation.findFirst({ where: { id, clientId } });
    if (!existing) throw new NotFoundException('Anotação não encontrada');

    if (requester.role === 'EMPLOYEE') {
      await this.ensureEmployeeRelation(clientId, requester, existing.userId);
    } else if (requester.role === 'CLIENT') {
      if (existing.createdById !== requester.userId) throw new ForbiddenException('Sem permissão');
    }

    await this.prisma.annotation.delete({ where: { id } });
    return { success: true, message: 'Anotação removida com sucesso' };
  }
}
