import { Injectable, Inject } from '@nestjs/common';
import { WorkspaceEntity } from '../../../domain/entities/workspace.entity';
import { IWorkspaceRepository } from '../../../domain/repositories/workspace.repository';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  isPublic?: boolean;
  clientId: string;
  createdBy: string;
}

@Injectable()
export class CreateWorkspaceUseCase {
  constructor(
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}

  async execute(input: CreateWorkspaceInput): Promise<WorkspaceEntity> {
    const workspace = WorkspaceEntity.create({
      name: input.name,
      description: input.description,
      isPublic: input.isPublic || false,
      clientId: input.clientId,
      createdBy: input.createdBy,
    });

    return await this.workspaceRepository.create(workspace);
  }
}
