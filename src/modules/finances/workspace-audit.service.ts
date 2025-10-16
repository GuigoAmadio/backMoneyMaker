import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEvent {
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class WorkspaceAuditService {
  private readonly logger = new Logger(WorkspaceAuditService.name);

  constructor(private prisma: PrismaService) {}

  // Log de evento de auditoria
  async logEvent(event: AuditEvent) {
    this.logger.log(
      `Logging audit event: ${event.action} on ${event.entityType} by user ${event.userId}`,
    );

    try {
      await this.prisma.sharedDataAudit.create({
        data: {
          clientId: event.workspaceId ? 'workspace' : 'global',
          workspaceId: event.workspaceId,
          userId: event.userId,
          action: event.action,
          entity: event.entityType,
          entityId: event.entityId,
          oldValues: event.oldValues,
          newValues: event.newValues,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });

      this.logger.log(`Audit event logged successfully: ${event.action}`);
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${event.action}`, error);
    }
  }

  // Log de criação de workspace
  async logWorkspaceCreated(
    workspaceId: string,
    userId: string,
    workspaceData: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'CREATE_WORKSPACE',
      entityType: 'WORKSPACE',
      entityId: workspaceId,
      newValues: workspaceData,
      ipAddress,
      userAgent,
    });
  }

  // Log de atualização de workspace
  async logWorkspaceUpdated(
    workspaceId: string,
    userId: string,
    oldValues: any,
    newValues: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'UPDATE_WORKSPACE',
      entityType: 'WORKSPACE',
      entityId: workspaceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });
  }

  // Log de adição de membro
  async logMemberAdded(
    workspaceId: string,
    userId: string,
    memberId: string,
    memberData: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'ADD_MEMBER',
      entityType: 'WORKSPACE_MEMBER',
      entityId: memberId,
      newValues: memberData,
      ipAddress,
      userAgent,
    });
  }

  // Log de remoção de membro
  async logMemberRemoved(
    workspaceId: string,
    userId: string,
    memberId: string,
    memberData: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'REMOVE_MEMBER',
      entityType: 'WORKSPACE_MEMBER',
      entityId: memberId,
      oldValues: memberData,
      ipAddress,
      userAgent,
    });
  }

  // Log de criação de transação
  async logTransactionCreated(
    workspaceId: string,
    userId: string,
    transactionId: string,
    transactionData: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'CREATE_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      newValues: transactionData,
      ipAddress,
      userAgent,
    });
  }

  // Log de atualização de transação
  async logTransactionUpdated(
    workspaceId: string,
    userId: string,
    transactionId: string,
    oldValues: any,
    newValues: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'UPDATE_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    });
  }

  // Log de deleção de transação
  async logTransactionDeleted(
    workspaceId: string,
    userId: string,
    transactionId: string,
    transactionData: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'DELETE_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      oldValues: transactionData,
      ipAddress,
      userAgent,
    });
  }

  // Log de transferência de propriedade
  async logOwnershipTransferred(
    workspaceId: string,
    userId: string,
    newOwnerId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.logEvent({
      workspaceId,
      userId,
      action: 'TRANSFER_OWNERSHIP',
      entityType: 'WORKSPACE',
      entityId: workspaceId,
      newValues: { newOwnerId },
      ipAddress,
      userAgent,
    });
  }

  // Buscar logs de auditoria
  async getAuditLogs(
    workspaceId: string,
    filters?: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    this.logger.log(`Fetching audit logs for workspace ${workspaceId}`);

    const { userId, action, entityType, startDate, endDate, page = 1, limit = 50 } = filters || {};

    const where: any = { workspaceId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.sharedDataAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.sharedDataAudit.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Found ${logs.length} audit logs for workspace ${workspaceId}`);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message: 'Logs de auditoria listados com sucesso',
    };
  }

  // Estatísticas de auditoria
  async getAuditStats(workspaceId: string, startDate?: Date, endDate?: Date) {
    this.logger.log(`Generating audit stats for workspace ${workspaceId}`);

    const where: any = { workspaceId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalEvents, eventsByAction, eventsByUser, eventsByEntity] = await Promise.all([
      this.prisma.sharedDataAudit.count({ where }),
      this.prisma.sharedDataAudit.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
      }),
      this.prisma.sharedDataAudit.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      this.prisma.sharedDataAudit.groupBy({
        by: ['entity'],
        where,
        _count: true,
        orderBy: { _count: { entity: 'desc' } },
      }),
    ]);

    this.logger.log(`Audit stats generated for workspace ${workspaceId}`);

    return {
      success: true,
      data: {
        totalEvents,
        eventsByAction,
        eventsByUser,
        eventsByEntity,
      },
      message: 'Estatísticas de auditoria geradas com sucesso',
    };
  }

  // Limpar logs antigos (manutenção)
  async cleanupOldLogs(daysToKeep: number = 365) {
    this.logger.log(`Cleaning up audit logs older than ${daysToKeep} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.sharedDataAudit.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old audit logs`);

    return {
      success: true,
      message: `${result.count} logs antigos removidos com sucesso`,
      deletedCount: result.count,
    };
  }
}
