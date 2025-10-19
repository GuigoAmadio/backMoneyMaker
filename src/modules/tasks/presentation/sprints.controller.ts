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
import { CreateSprintUseCase } from '../application/use-cases/sprint/create-sprint.use-case';
import { ISprintRepository } from '../domain/repositories/sprint.repository';
import { CreateSprintDto } from '../dto/create-sprint.dto';
import { UpdateSprintDto } from '../dto/update-sprint.dto';
import { SPRINT_REPOSITORY } from '../tasks.module';

@ApiTags('Sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/sprints')
export class SprintsController {
  constructor(
    private readonly createSprintUseCase: CreateSprintUseCase,
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepository: ISprintRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo sprint' })
  async create(@Body() dto: CreateSprintDto) {
    console.log('🔍 [SprintsController.create] Criando sprint');

    const sprint = await this.createSprintUseCase.execute({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    return {
      success: true,
      data: sprint.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar sprints de um workspace' })
  async findAll(@Query('workspaceId') workspaceId: string, @Query('status') status?: string) {
    console.log('🔍 [SprintsController.findAll] Listando sprints');

    if (!workspaceId) {
      throw new Error('workspaceId is required');
    }

    const sprints = await this.sprintRepository.findByWorkspace(workspaceId, status as any);

    return {
      success: true,
      data: sprints.map((s) => s.toPlainObject()),
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Buscar sprint ativo do workspace' })
  async findActive(@Query('workspaceId') workspaceId: string) {
    console.log('🔍 [SprintsController.findActive] Buscando sprint ativo');

    if (!workspaceId) {
      throw new Error('workspaceId is required');
    }

    const sprint = await this.sprintRepository.findActive(workspaceId);

    return {
      success: true,
      data: sprint ? sprint.toPlainObject() : null,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar sprint por ID' })
  async findOne(@Param('id') id: string) {
    console.log('🔍 [SprintsController.findOne] Buscando sprint:', id);

    const sprint = await this.sprintRepository.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    return {
      success: true,
      data: sprint.toPlainObject(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar sprint' })
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    console.log('🔍 [SprintsController.update] Atualizando sprint:', id);

    const sprint = await this.sprintRepository.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    if (dto.name) sprint.updateName(dto.name);
    if (dto.goal !== undefined) sprint.updateGoal(dto.goal);
    if (dto.startDate && dto.endDate) {
      sprint.updateDates(new Date(dto.startDate), new Date(dto.endDate));
    }

    const updated = await this.sprintRepository.update(sprint);

    return {
      success: true,
      data: updated.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar sprint' })
  async delete(@Param('id') id: string) {
    console.log('🔍 [SprintsController.delete] Deletando sprint:', id);
    await this.sprintRepository.delete(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar sprint' })
  async start(@Param('id') id: string) {
    console.log('🔍 [SprintsController.start] Iniciando sprint:', id);

    const sprint = await this.sprintRepository.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    sprint.start();
    const updated = await this.sprintRepository.update(sprint);

    return {
      success: true,
      data: updated.toPlainObject(),
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar sprint' })
  async complete(@Param('id') id: string) {
    console.log('🔍 [SprintsController.complete] Completando sprint:', id);

    const sprint = await this.sprintRepository.findById(id);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    sprint.complete();
    const updated = await this.sprintRepository.update(sprint);

    return {
      success: true,
      data: updated.toPlainObject(),
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estatísticas do sprint' })
  async getStats(@Param('id') id: string) {
    console.log('🔍 [SprintsController.getStats] Buscando estatísticas');

    const [totalTasks, completedTasks] = await Promise.all([
      this.sprintRepository.countTasks(id),
      this.sprintRepository.countCompletedTasks(id),
    ]);

    return {
      success: true,
      data: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    };
  }
}
