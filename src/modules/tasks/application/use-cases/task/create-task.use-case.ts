import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { TaskEntity } from '../../../domain/entities/task.entity';
import { ITaskRepository } from '../../../domain/repositories/task.repository';
import { TASK_REPOSITORY } from '../../../tasks.module';
import { TaskPriorityVO } from '../../../domain/value-objects/task-priority.vo';
import { TaskStatusVO } from '../../../domain/value-objects/task-status.vo';
import { TaskTypeVO } from '../../../domain/value-objects/task-type.vo';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  workspaceId: string;
  boardId?: string;
  columnId?: string;
  parentTaskId?: string;
  sprintId?: string;
  assigneeIds?: string[];
  estimatedHours?: number;
  dueDate?: Date;
  startDate?: Date;
  tags?: string[];
  labels?: string[];
  order?: number;
  createdById: string;
}

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<TaskEntity> {
    console.log('🔍 [CreateTaskUseCase] Criando tarefa:', input.title);

    try {
      // Criar Value Objects
      const type = input.type ? TaskTypeVO.create(input.type) : TaskTypeVO.create(TaskType.TASK);

      const status = input.status
        ? TaskStatusVO.create(input.status)
        : TaskStatusVO.create(TaskStatus.TODO);

      const priority = input.priority
        ? TaskPriorityVO.create(input.priority)
        : TaskPriorityVO.create(TaskPriority.MEDIUM);

      // Se tem parent task, validar que ela existe
      if (input.parentTaskId) {
        const parentTask = await this.taskRepository.findById(input.parentTaskId);
        if (!parentTask) {
          throw new NotFoundException(`Parent task ${input.parentTaskId} not found`);
        }

        if (!parentTask.canHaveSubtasks()) {
          throw new Error('Parent task cannot have subtasks');
        }
      }

      // Criar entidade
      const task = TaskEntity.create({
        title: input.title,
        description: input.description,
        type,
        status,
        priority,
        workspaceId: input.workspaceId,
        boardId: input.boardId,
        columnId: input.columnId,
        parentTaskId: input.parentTaskId,
        sprintId: input.sprintId,
        estimatedHours: input.estimatedHours,
        dueDate: input.dueDate,
        startDate: input.startDate,
        tags: input.tags || [],
        labels: input.labels || [],
        order: input.order || 0,
        createdById: input.createdById,
      });

      // Salvar no repositório
      const savedTask = await this.taskRepository.create(task);

      // Atribuir usuários se fornecidos
      if (input.assigneeIds && input.assigneeIds.length > 0) {
        await this.taskRepository.assignUsers(savedTask.id, input.assigneeIds);
      }

      console.log('✅ [CreateTaskUseCase] Tarefa criada:', savedTask.id);
      return savedTask;
    } catch (error) {
      console.error('❌ [CreateTaskUseCase] Erro ao criar tarefa:', error);
      throw error;
    }
  }
}
