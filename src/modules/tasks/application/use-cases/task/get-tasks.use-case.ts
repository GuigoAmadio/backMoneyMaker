import { Injectable, Inject } from '@nestjs/common';
import {
  ITaskRepository,
  TaskFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/repositories/task.repository';
import { TaskEntity } from '../../../domain/entities/task.entity';
import { TASK_REPOSITORY } from '../../../tasks.module';

@Injectable()
export class GetTasksUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(
    workspaceId: string,
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TaskEntity>> {
    console.log('🔍 [GetTasksUseCase] Buscando tarefas do workspace:', workspaceId);

    try {
      const result = await this.taskRepository.findByWorkspace(workspaceId, filters, pagination);

      console.log(`✅ [GetTasksUseCase] ${result.data.length} tarefas encontradas`);
      return result;
    } catch (error) {
      console.error('❌ [GetTasksUseCase] Erro ao buscar tarefas:', error);
      throw error;
    }
  }
}
