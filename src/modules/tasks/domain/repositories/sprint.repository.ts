import { SprintEntity } from '../entities/sprint.entity';
import { SprintStatus } from '@prisma/client';

export interface ISprintRepository {
  create(sprint: SprintEntity): Promise<SprintEntity>;
  update(sprint: SprintEntity): Promise<SprintEntity>;
  findById(id: string): Promise<SprintEntity | null>;
  findByWorkspace(workspaceId: string, status?: SprintStatus): Promise<SprintEntity[]>;
  findActive(workspaceId: string): Promise<SprintEntity | null>;
  delete(id: string): Promise<void>;
  countTasks(sprintId: string): Promise<number>;
  countCompletedTasks(sprintId: string): Promise<number>;
}

