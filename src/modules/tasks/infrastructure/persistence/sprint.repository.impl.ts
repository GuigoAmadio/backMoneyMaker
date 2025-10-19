import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { ISprintRepository } from '../../domain/repositories/sprint.repository';
import { SprintEntity } from '../../domain/entities/sprint.entity';
import { SprintStatusVO } from '../../domain/value-objects/sprint-status.vo';
import { Sprint, SprintStatus, Prisma } from '@prisma/client';

@Injectable()
export class SprintRepositoryImpl implements ISprintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(sprint: SprintEntity): Promise<SprintEntity> {
    const data: Prisma.SprintCreateInput = {
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      workspace: { connect: { id: sprint.workspaceId } },
      status: sprint.status.getValue(),
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
    };

    const created = await this.prisma.sprint.create({ data });
    return this.toDomain(created);
  }

  async update(sprint: SprintEntity): Promise<SprintEntity> {
    const data: Prisma.SprintUpdateInput = {
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status.getValue(),
      updatedAt: sprint.updatedAt,
    };

    const updated = await this.prisma.sprint.update({
      where: { id: sprint.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<SprintEntity | null> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });

    return sprint ? this.toDomain(sprint) : null;
  }

  async findByWorkspace(workspaceId: string, status?: SprintStatus): Promise<SprintEntity[]> {
    const sprints = await this.prisma.sprint.findMany({
      where: {
        workspaceId,
        ...(status && { status }),
      },
      orderBy: { startDate: 'desc' },
    });

    return sprints.map((s) => this.toDomain(s));
  }

  async findActive(workspaceId: string): Promise<SprintEntity | null> {
    const sprint = await this.prisma.sprint.findFirst({
      where: {
        workspaceId,
        status: SprintStatus.ACTIVE,
      },
    });

    return sprint ? this.toDomain(sprint) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sprint.delete({ where: { id } });
  }

  async countTasks(sprintId: string): Promise<number> {
    return this.prisma.task.count({
      where: { sprintId },
    });
  }

  async countCompletedTasks(sprintId: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        sprintId,
        status: 'DONE',
      },
    });
  }

  private toDomain(sprint: Sprint): SprintEntity {
    return SprintEntity.reconstitute({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal || undefined,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      workspaceId: sprint.workspaceId,
      status: SprintStatusVO.create(sprint.status),
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
    });
  }
}
