import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { WorkspaceEntity } from '../../domain/entities/workspace.entity';
import { Workspace, Prisma } from '@prisma/client';

@Injectable()
export class WorkspaceRepositoryImpl implements IWorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspace: WorkspaceEntity): Promise<WorkspaceEntity> {
    const data: Prisma.WorkspaceCreateInput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      isPublic: workspace.isPublic,
      client: { connect: { id: workspace.clientId } },
      creator: { connect: { id: workspace.createdBy } },
      members: {
        create: {
          userId: workspace.createdBy,
          role: 'OWNER',
        },
      },
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };

    const created = await this.prisma.workspace.create({ data });
    return this.toDomain(created);
  }

  async update(workspace: WorkspaceEntity): Promise<WorkspaceEntity> {
    const data: Prisma.WorkspaceUpdateInput = {
      name: workspace.name,
      description: workspace.description,
      isPublic: workspace.isPublic,
      updatedAt: workspace.updatedAt,
    };

    const updated = await this.prisma.workspace.update({
      where: { id: workspace.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<WorkspaceEntity | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    return workspace ? this.toDomain(workspace) : null;
  }

  async findByClient(clientId: string): Promise<WorkspaceEntity[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return workspaces.map((w) => this.toDomain(w));
  }

  async findByUser(clientId: string, userId: string): Promise<WorkspaceEntity[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        clientId,
        members: {
          some: {
            userId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workspaces.map((w) => this.toDomain(w));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id } });
  }

  async addMember(workspaceId: string, userId: string, role: string): Promise<any> {
    return await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: role as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  }

  async getMembers(workspaceId: string): Promise<any[]> {
    return await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        permissions: true,
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(memberId: string, role: string): Promise<any> {
    return await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as any },
    });
  }

  async checkMembership(workspaceId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    return !!membership;
  }

  async checkPermission(workspaceId: string, userId: string, permission: string): Promise<boolean> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
      include: {
        permissions: true,
      },
    });

    if (!membership) {
      return false;
    }

    // Owners e Admins têm todas as permissões
    if (membership.role === 'OWNER' || membership.role === 'ADMIN') {
      return true;
    }

    // Verificar permissões específicas
    return membership.permissions.some(
      (p) => p.permission === permission || p.permission === 'ALL',
    );
  }

  private toDomain(workspace: Workspace): WorkspaceEntity {
    return WorkspaceEntity.reconstitute({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description || undefined,
      isPublic: workspace.isPublic,
      clientId: workspace.clientId,
      createdBy: workspace.createdBy,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  }
}
