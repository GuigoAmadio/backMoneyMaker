import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { CreateTaskUseCase } from '../application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/task/update-task.use-case';
import { GetTasksUseCase } from '../application/use-cases/task/get-tasks.use-case';
import { ITaskRepository } from '../domain/repositories/task.repository';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { GetTasksDto } from '../dto/get-tasks.dto';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { MoveTaskDto } from '../dto/move-task.dto';
import { TASK_REPOSITORY } from '../tasks.module';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tasks')
export class TasksController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly updateTaskUseCase: UpdateTaskUseCase,
    private readonly getTasksUseCase: GetTasksUseCase,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova tarefa' })
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    console.log('🔍 [TasksController.create] Criando tarefa');

    const task = await this.createTaskUseCase.execute({
      ...dto,
      createdById: user.id,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    });

    return {
      success: true,
      data: task.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas com filtros' })
  async findAll(@Query() dto: GetTasksDto) {
    console.log('🔍 [TasksController.findAll] Listando tarefas');

    if (!dto.workspaceId) {
      throw new Error('workspaceId is required');
    }

    const result = await this.getTasksUseCase.execute(
      dto.workspaceId,
      {
        boardId: dto.boardId,
        columnId: dto.columnId,
        sprintId: dto.sprintId,
        assigneeId: dto.assigneeId,
        status: dto.status,
        priority: dto.priority,
        type: dto.type,
        search: dto.search,
        tag: dto.tag,
        label: dto.label,
      },
      {
        page: dto.page || 1,
        limit: dto.limit || 50,
      },
    );

    return {
      success: true,
      data: result.data.map((t) => t.toPlainObject()),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tarefa por ID' })
  async findOne(@Param('id') id: string) {
    console.log('🔍 [TasksController.findOne] Buscando tarefa:', id);

    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    return {
      success: true,
      data: task.toPlainObject(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tarefa' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    console.log('🔍 [TasksController.update] Atualizando tarefa:', id);

    const task = await this.updateTaskUseCase.execute({
      id,
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    });

    return {
      success: true,
      data: task.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar tarefa' })
  async delete(@Param('id') id: string) {
    console.log('🔍 [TasksController.delete] Deletando tarefa:', id);
    await this.taskRepository.delete(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Atribuir usuários à tarefa' })
  async assign(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    console.log('🔍 [TasksController.assign] Atribuindo usuários:', id);

    await this.taskRepository.assignUsers(id, dto.userIds);

    return {
      success: true,
      message: 'Users assigned successfully',
    };
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Mover tarefa para outra coluna' })
  async move(@Param('id') id: string, @Body() dto: MoveTaskDto) {
    console.log('🔍 [TasksController.move] Movendo tarefa:', id);

    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    task.moveToColumn(dto.columnId, dto.order);
    const updated = await this.taskRepository.update(task);

    return {
      success: true,
      data: updated.toPlainObject(),
    };
  }

  @Get(':id/subtasks')
  @ApiOperation({ summary: 'Listar subtarefas de uma tarefa' })
  async getSubtasks(@Param('id') id: string) {
    console.log('🔍 [TasksController.getSubtasks] Buscando subtarefas:', id);

    const subtasks = await this.taskRepository.findSubtasks(id);

    return {
      success: true,
      data: subtasks.map((t) => t.toPlainObject()),
    };
  }

  @Get('workspace/:workspaceId/stats')
  @ApiOperation({ summary: 'Estatísticas das tarefas do workspace' })
  async getStats(@Param('workspaceId') workspaceId: string) {
    console.log('🔍 [TasksController.getStats] Buscando estatísticas');

    const [byStatus, byPriority] = await Promise.all([
      this.taskRepository.countByStatus(workspaceId),
      this.taskRepository.countByPriority(workspaceId),
    ]);

    return {
      success: true,
      data: {
        byStatus,
        byPriority,
      },
    };
  }
}
