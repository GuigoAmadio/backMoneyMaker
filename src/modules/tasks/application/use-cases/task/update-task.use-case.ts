import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { TaskEntity } from '../../../domain/entities/task.entity';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { TASK_REPOSITORY } from '../../../tasks.module';
import { TaskPriorityVO } from '../../../domain/value-objects/task-priority.vo';
import { TaskStatusVO } from '../../../domain/value-objects/task-status.vo';
import { TaskTypeVO } from '../../../domain/value-objects/task-type.vo';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  boardId?: string;
  columnId?: string;
  sprintId?: string;
  estimatedHours?: number;
  dueDate?: Date;
  startDate?: Date;
  tags?: string[];
  labels?: string[];
  order?: number;
}

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(input: UpdateTaskInput): Promise<TaskEntity> {
    console.log('🔍 [UpdateTaskUseCase] Atualizando tarefa:', input.id);

    try {
      // Buscar tarefa existente
      const task = await this.taskRepository.findById(input.id);
      if (!task) {
        throw new NotFoundException(`Task ${input.id} not found`);
      }

      // Atualizar campos
      if (input.title) {
        task.updateTitle(input.title);
      }

      if (input.description !== undefined) {
        task.updateDescription(input.description);
      }

      if (input.status) {
        const newStatus = TaskStatusVO.create(input.status);
        task.changeStatus(newStatus);
      }

      if (input.priority) {
        const newPriority = TaskPriorityVO.create(input.priority);
        task.changePriority(newPriority);
      }

      if (input.estimatedHours !== undefined) {
        task.setEstimatedHours(input.estimatedHours);
      }

      if (input.dueDate !== undefined) {
        task.setDueDate(input.dueDate);
      }

      if (input.startDate !== undefined) {
        task.setStartDate(input.startDate);
      }

      if (input.sprintId !== undefined) {
        if (input.sprintId) {
          task.assignToSprint(input.sprintId);
        } else {
          task.removeFromSprint();
        }
      }

      if (input.columnId !== undefined) {
        task.moveToColumn(input.columnId, input.order);
      }

      // Salvar alterações
      const updatedTask = await this.taskRepository.update(task);

      console.log('✅ [UpdateTaskUseCase] Tarefa atualizada:', updatedTask.id);
      return updatedTask;
    } catch (error) {
      console.error('❌ [UpdateTaskUseCase] Erro ao atualizar tarefa:', error);
      throw error;
    }
  }
}
