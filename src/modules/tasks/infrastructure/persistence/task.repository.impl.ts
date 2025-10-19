import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ITaskRepository,
  TaskFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/task.repository';
import { TaskEntity } from '../../domain/entities/task.entity';
import { TaskPriorityVO } from '../../domain/value-objects/task-priority.vo';
import { TaskStatusVO } from '../../domain/value-objects/task-status.vo';
import { TaskTypeVO } from '../../domain/value-objects/task-type.vo';
import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';

@Injectable()
export class TaskRepositoryImpl implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(task: TaskEntity): Promise<TaskEntity> {
    const data: Prisma.TaskCreateInput = {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type.getValue(),
      status: task.status.getValue(),
      priority: task.priority.getValue(),
      workspace: { connect: { id: task.workspaceId } },
      board: task.boardId ? { connect: { id: task.boardId } } : undefined,
      column: task.columnId ? { connect: { id: task.columnId } } : undefined,
      parentTask: task.parentTaskId ? { connect: { id: task.parentTaskId } } : undefined,
      sprint: task.sprintId ? { connect: { id: task.sprintId } } : undefined,
      estimatedHours: task.estimatedHours,
      dueDate: task.dueDate,
      startDate: task.startDate,
      completedAt: task.completedAt,
      tags: task.tags,
      labels: task.labels,
      order: task.order,
      createdBy: { connect: { id: task.createdById } },
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    const created = await this.prisma.task.create({ data });
    return this.toDomain(created);
  }

  async update(task: TaskEntity): Promise<TaskEntity> {
    const data: Prisma.TaskUpdateInput = {
      title: task.title,
      description: task.description,
      type: task.type.getValue(),
      status: task.status.getValue(),
      priority: task.priority.getValue(),
      board: task.boardId ? { connect: { id: task.boardId } } : { disconnect: true },
      column: task.columnId ? { connect: { id: task.columnId } } : { disconnect: true },
      sprint: task.sprintId ? { connect: { id: task.sprintId } } : { disconnect: true },
      estimatedHours: task.estimatedHours,
      dueDate: task.dueDate,
      startDate: task.startDate,
      completedAt: task.completedAt,
      tags: task.tags,
      labels: task.labels,
      order: task.order,
      updatedAt: task.updatedAt,
    };

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<TaskEntity | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    return task ? this.toDomain(task) : null;
  }

  async findByWorkspace(
    workspaceId: string,
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TaskEntity>> {
    const where: Prisma.TaskWhereInput = {
      workspaceId,
      ...(filters?.boardId && { boardId: filters.boardId }),
      ...(filters?.columnId && { columnId: filters.columnId }),
      ...(filters?.sprintId && { sprintId: filters.sprintId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.parentTaskId !== undefined && { parentTaskId: filters.parentTaskId }),
      ...(filters?.assigneeId && {
        assignees: { some: { userId: filters.assigneeId } },
      }),
      ...(filters?.tag && { tags: { has: filters.tag } }),
      ...(filters?.label && { labels: { has: filters.label } }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((t) => this.toDomain(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubtasks(parentTaskId: string): Promise<TaskEntity[]> {
    const tasks = await this.prisma.task.findMany({
      where: { parentTaskId },
      orderBy: { order: 'asc' },
    });

    return tasks.map((t) => this.toDomain(t));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async assignUsers(taskId: string, userIds: string[]): Promise<void> {
    // Remover atribuições existentes
    await this.prisma.taskAssignment.deleteMany({
      where: { taskId },
    });

    // Criar novas atribuições
    await this.prisma.taskAssignment.createMany({
      data: userIds.map((userId) => ({
        taskId,
        userId,
      })),
    });
  }

  async unassignUser(taskId: string, userId: string): Promise<void> {
    await this.prisma.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  async countByStatus(workspaceId: string): Promise<Record<TaskStatus, number>> {
    const counts = await this.prisma.task.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: true,
    });

    const result = {} as Record<TaskStatus, number>;
    for (const status of Object.values(TaskStatus)) {
      result[status] = counts.find((c) => c.status === status)?._count || 0;
    }

    return result;
  }

  async countByPriority(workspaceId: string): Promise<Record<TaskPriority, number>> {
    const counts = await this.prisma.task.groupBy({
      by: ['priority'],
      where: { workspaceId },
      _count: true,
    });

    const result = {} as Record<TaskPriority, number>;
    for (const priority of Object.values(TaskPriority)) {
      result[priority] = counts.find((c) => c.priority === priority)?._count || 0;
    }

    return result;
  }

  private toDomain(task: Task): TaskEntity {
    return TaskEntity.reconstitute({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      type: TaskTypeVO.create(task.type),
      status: TaskStatusVO.create(task.status),
      priority: TaskPriorityVO.create(task.priority),
      workspaceId: task.workspaceId,
      boardId: task.boardId || undefined,
      columnId: task.columnId || undefined,
      parentTaskId: task.parentTaskId || undefined,
      sprintId: task.sprintId || undefined,
      estimatedHours: task.estimatedHours ? Number(task.estimatedHours) : undefined,
      dueDate: task.dueDate || undefined,
      startDate: task.startDate || undefined,
      completedAt: task.completedAt || undefined,
      tags: task.tags,
      labels: task.labels,
      order: task.order,
      createdById: task.createdById,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }
}
