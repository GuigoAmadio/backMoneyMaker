import { Injectable, Inject } from '@nestjs/common';
import { SprintEntity } from '../../../domain/entities/sprint.entity';
import { ISprintRepository } from '../../../domain/repositories/sprint.repository';
import { SPRINT_REPOSITORY } from '../../../tasks.module';
import { SprintStatusVO } from '../../../domain/value-objects/sprint-status.vo';
import { SprintStatus } from '@prisma/client';

export interface CreateSprintInput {
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  workspaceId: string;
}

@Injectable()
export class CreateSprintUseCase {
  constructor(
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepository: ISprintRepository,
  ) {}

  async execute(input: CreateSprintInput): Promise<SprintEntity> {
    console.log('🔍 [CreateSprintUseCase] Criando sprint:', input.name);

    try {
      const sprint = SprintEntity.create({
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
        workspaceId: input.workspaceId,
        status: SprintStatusVO.create(SprintStatus.PLANNED),
      });

      const savedSprint = await this.sprintRepository.create(sprint);

      console.log('✅ [CreateSprintUseCase] Sprint criado:', savedSprint.id);
      return savedSprint;
    } catch (error) {
      console.error('❌ [CreateSprintUseCase] Erro ao criar sprint:', error);
      throw error;
    }
  }
}
