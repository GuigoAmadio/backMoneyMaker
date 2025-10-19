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
import { CreateBoardUseCase } from '../application/use-cases/board/create-board.use-case';
import { IBoardRepository } from '../domain/repositories/board.repository';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { BOARD_REPOSITORY } from '../tasks.module';

@ApiTags('Boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/boards')
export class BoardsController {
  constructor(
    private readonly createBoardUseCase: CreateBoardUseCase,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepository: IBoardRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo board' })
  async create(@Body() dto: CreateBoardDto) {
    console.log('🔍 [BoardsController.create] Criando board');

    const board = await this.createBoardUseCase.execute(dto);

    return {
      success: true,
      data: board.toPlainObject(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar boards de um workspace' })
  async findAll(@Query('workspaceId') workspaceId: string) {
    console.log('🔍 [BoardsController.findAll] Listando boards');

    if (!workspaceId) {
      throw new Error('workspaceId is required');
    }

    const boards = await this.boardRepository.findByWorkspace(workspaceId);

    return {
      success: true,
      data: boards.map((b) => b.toPlainObject()),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar board por ID' })
  async findOne(@Param('id') id: string) {
    console.log('🔍 [BoardsController.findOne] Buscando board:', id);

    const board = await this.boardRepository.findById(id);
    if (!board) {
      throw new Error('Board not found');
    }

    return {
      success: true,
      data: board.toPlainObject(),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar board' })
  async update(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    console.log('🔍 [BoardsController.update] Atualizando board:', id);

    const board = await this.boardRepository.findById(id);
    if (!board) {
      throw new Error('Board not found');
    }

    if (dto.name) board.updateName(dto.name);
    if (dto.description !== undefined) board.updateDescription(dto.description);
    if (dto.color !== undefined) board.updateColor(dto.color);
    if (dto.icon !== undefined) board.updateIcon(dto.icon);

    const updated = await this.boardRepository.update(board);

    return {
      success: true,
      data: updated.toPlainObject(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar board' })
  async delete(@Param('id') id: string) {
    console.log('🔍 [BoardsController.delete] Deletando board:', id);
    await this.boardRepository.delete(id);
  }

  @Get(':id/columns')
  @ApiOperation({ summary: 'Listar colunas do board' })
  async getColumns(@Param('id') id: string) {
    console.log('🔍 [BoardsController.getColumns] Listando colunas');

    const columns = await this.boardRepository.findColumnsByBoard(id);

    return {
      success: true,
      data: columns.map((c) => c.toPlainObject()),
    };
  }
}
