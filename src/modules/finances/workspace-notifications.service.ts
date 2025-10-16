import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface NotificationData {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

@Injectable()
export class WorkspaceNotificationsService {
  private readonly logger = new Logger(WorkspaceNotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // Criar notificação
  async createNotification(notificationData: NotificationData) {
    this.logger.log(
      `Creating notification for user ${notificationData.userId} in workspace ${notificationData.workspaceId}`,
    );

    try {
      const notification = await this.prisma.workspaceNotification.create({
        data: {
          clientId: notificationData.workspaceId ? 'workspace' : 'global',
          workspaceId: notificationData.workspaceId,
          userId: notificationData.userId,
          type: notificationData.type as any,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          isRead: false,
        },
      });

      this.logger.log(`Notification created: ${notification.id}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  // Notificar adição de membro
  async notifyMemberAdded(
    workspaceId: string,
    addedUserId: string,
    addedByUserId: string,
    workspaceName: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId: addedUserId,
      type: 'MEMBER_ADDED',
      title: 'Você foi adicionado a um workspace',
      message: `Você foi adicionado ao workspace "${workspaceName}"`,
      priority: 'MEDIUM',
      data: {
        workspaceId,
        addedBy: addedByUserId,
        workspaceName,
      },
    });

    this.logger.log(`Member added notification sent to user ${addedUserId}`);
    return notification;
  }

  // Notificar remoção de membro
  async notifyMemberRemoved(
    workspaceId: string,
    removedUserId: string,
    removedByUserId: string,
    workspaceName: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId: removedUserId,
      type: 'MEMBER_REMOVED',
      title: 'Você foi removido de um workspace',
      message: `Você foi removido do workspace "${workspaceName}"`,
      priority: 'HIGH',
      data: {
        workspaceId,
        removedBy: removedByUserId,
        workspaceName,
      },
    });

    this.logger.log(`Member removed notification sent to user ${removedUserId}`);
    return notification;
  }

  // Notificar nova transação
  async notifyNewTransaction(
    workspaceId: string,
    userId: string,
    transactionData: any,
    createdByUserId: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId,
      type: 'NEW_TRANSACTION',
      title: 'Nova transação adicionada',
      message: `Nova transação: ${transactionData.title} - R$ ${transactionData.amount}`,
      priority: 'LOW',
      data: {
        transactionId: transactionData.id,
        createdBy: createdByUserId,
        transaction: transactionData,
      },
    });

    this.logger.log(`New transaction notification sent to user ${userId}`);
    return notification;
  }

  // Notificar transação atualizada
  async notifyTransactionUpdated(
    workspaceId: string,
    userId: string,
    transactionData: any,
    updatedByUserId: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId,
      type: 'TRANSACTION_UPDATED',
      title: 'Transação atualizada',
      message: `Transação "${transactionData.title}" foi atualizada`,
      priority: 'LOW',
      data: {
        transactionId: transactionData.id,
        updatedBy: updatedByUserId,
        transaction: transactionData,
      },
    });

    this.logger.log(`Transaction updated notification sent to user ${userId}`);
    return notification;
  }

  // Notificar transferência de propriedade
  async notifyOwnershipTransferred(
    workspaceId: string,
    newOwnerId: string,
    previousOwnerId: string,
    workspaceName: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId: newOwnerId,
      type: 'OWNERSHIP_TRANSFERRED',
      title: 'Você é agora o proprietário do workspace',
      message: `A propriedade do workspace "${workspaceName}" foi transferida para você`,
      priority: 'HIGH',
      data: {
        workspaceId,
        previousOwner: previousOwnerId,
        workspaceName,
      },
    });

    this.logger.log(`Ownership transferred notification sent to user ${newOwnerId}`);
    return notification;
  }

  // Notificar orçamento ultrapassado
  async notifyBudgetExceeded(
    workspaceId: string,
    userId: string,
    budgetData: any,
    categoryName: string,
  ) {
    const notification = await this.createNotification({
      workspaceId,
      userId,
      type: 'BUDGET_EXCEEDED',
      title: 'Orçamento ultrapassado',
      message: `O orçamento da categoria "${categoryName}" foi ultrapassado`,
      priority: 'MEDIUM',
      data: {
        budgetId: budgetData.id,
        categoryName,
        budget: budgetData,
      },
    });

    this.logger.log(`Budget exceeded notification sent to user ${userId}`);
    return notification;
  }

  // Notificar meta financeira concluída
  async notifyGoalCompleted(workspaceId: string, userId: string, goalData: any) {
    const notification = await this.createNotification({
      workspaceId,
      userId,
      type: 'GOAL_COMPLETED',
      title: 'Meta financeira concluída!',
      message: `Parabéns! Você concluiu a meta "${goalData.title}"`,
      priority: 'HIGH',
      data: {
        goalId: goalData.id,
        goal: goalData,
      },
    });

    this.logger.log(`Goal completed notification sent to user ${userId}`);
    return notification;
  }

  // Listar notificações do usuário
  async getUserNotifications(
    userId: string,
    workspaceId?: string,
    filters?: {
      type?: string;
      isRead?: boolean;
      priority?: string;
      page?: number;
      limit?: number;
    },
  ) {
    this.logger.log(`Fetching notifications for user ${userId}`);

    const { type, isRead, priority, page = 1, limit = 20 } = filters || {};

    const where: any = { userId };
    if (workspaceId) where.workspaceId = workspaceId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;
    if (priority) where.priority = priority;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.workspaceNotification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.workspaceNotification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Found ${notifications.length} notifications for user ${userId}`);

    return {
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      message: 'Notificações listadas com sucesso',
    };
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string, userId: string) {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);

    const notification = await this.prisma.workspaceNotification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      throw new Error('Notificação não encontrada ou não pertence ao usuário');
    }

    this.logger.log(`Notification ${notificationId} marked as read`);
    return {
      success: true,
      message: 'Notificação marcada como lida',
    };
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string, workspaceId?: string) {
    this.logger.log(`Marking all notifications as read for user ${userId}`);

    const where: any = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;

    const result = await this.prisma.workspaceNotification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.log(`${result.count} notifications marked as read for user ${userId}`);

    return {
      success: true,
      message: `${result.count} notificações marcadas como lidas`,
      count: result.count,
    };
  }

  // Contar notificações não lidas
  async getUnreadCount(userId: string, workspaceId?: string) {
    this.logger.log(`Counting unread notifications for user ${userId}`);

    const where: any = { userId, isRead: false };
    if (workspaceId) where.workspaceId = workspaceId;

    const count = await this.prisma.workspaceNotification.count({ where });

    this.logger.log(`Found ${count} unread notifications for user ${userId}`);

    return {
      success: true,
      data: { count },
      message: 'Contagem de notificações não lidas',
    };
  }

  // Limpar notificações antigas
  async cleanupOldNotifications(daysToKeep: number = 30) {
    this.logger.log(`Cleaning up notifications older than ${daysToKeep} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.workspaceNotification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    this.logger.log(`Cleaned up ${result.count} old notifications`);

    return {
      success: true,
      message: `${result.count} notificações antigas removidas`,
      deletedCount: result.count,
    };
  }
}
