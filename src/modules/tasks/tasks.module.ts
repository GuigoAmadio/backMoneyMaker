import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Injection tokens
export const TASK_REPOSITORY = 'TASK_REPOSITORY';
export const BOARD_REPOSITORY = 'BOARD_REPOSITORY';
export const SPRINT_REPOSITORY = 'SPRINT_REPOSITORY';

// Infrastructure - Repository Implementations
import { TaskRepositoryImpl } from './infrastructure/persistence/task.repository.impl';
import { BoardRepositoryImpl } from './infrastructure/persistence/board.repository.impl';
import { SprintRepositoryImpl } from './infrastructure/persistence/sprint.repository.impl';

// Application - Use Cases
import { CreateTaskUseCase } from './application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from './application/use-cases/task/update-task.use-case';
import { GetTasksUseCase } from './application/use-cases/task/get-tasks.use-case';
import { CreateBoardUseCase } from './application/use-cases/board/create-board.use-case';
import { CreateSprintUseCase } from './application/use-cases/sprint/create-sprint.use-case';

// Presentation - Controllers
import { TasksController } from './presentation/tasks.controller';
import { BoardsController } from './presentation/boards.controller';
import { SprintsController } from './presentation/sprints.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TasksController, BoardsController, SprintsController],
  providers: [
    // Repository implementations with string tokens
    {
      provide: TASK_REPOSITORY,
      useClass: TaskRepositoryImpl,
    },
    {
      provide: BOARD_REPOSITORY,
      useClass: BoardRepositoryImpl,
    },
    {
      provide: SPRINT_REPOSITORY,
      useClass: SprintRepositoryImpl,
    },

    // Use Cases
    CreateTaskUseCase,
    UpdateTaskUseCase,
    GetTasksUseCase,
    CreateBoardUseCase,
    CreateSprintUseCase,
  ],
  exports: [
    TASK_REPOSITORY,
    BOARD_REPOSITORY,
    SPRINT_REPOSITORY,
    CreateTaskUseCase,
    UpdateTaskUseCase,
    GetTasksUseCase,
    CreateBoardUseCase,
    CreateSprintUseCase,
  ],
})
export class TasksModule {}
