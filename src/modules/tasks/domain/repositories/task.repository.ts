import { TaskEntity } from '../entities/task.entity';
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client';

export interface TaskFilters {
  workspaceId?: string;
  boardId?: string;
  columnId?: string;
  sprintId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  search?: string;
  tag?: string;
  label?: string;
  parentTaskId?: string | null;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITaskRepository {
  create(task: TaskEntity): Promise<TaskEntity>;
  update(task: TaskEntity): Promise<TaskEntity>;
  findById(id: string): Promise<TaskEntity | null>;
  findByWorkspace(
    workspaceId: string,
    filters?: TaskFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TaskEntity>>;
  findSubtasks(parentTaskId: string): Promise<TaskEntity[]>;
  delete(id: string): Promise<void>;
  assignUsers(taskId: string, userIds: string[]): Promise<void>;
  unassignUser(taskId: string, userId: string): Promise<void>;
  countByStatus(workspaceId: string): Promise<Record<TaskStatus, number>>;
  countByPriority(workspaceId: string): Promise<Record<TaskPriority, number>>;
}

