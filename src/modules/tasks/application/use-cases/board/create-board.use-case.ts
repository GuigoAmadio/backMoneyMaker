import { Injectable, Inject } from '@nestjs/common';
import { BoardEntity } from '../../../domain/entities/board.entity';
import { BoardColumnEntity } from '../../../domain/entities/board-column.entity';
import { IBoardRepository } from '../../../domain/repositories/board.repository';
import { BOARD_REPOSITORY } from '../../../tasks.module';

export interface CreateBoardInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  workspaceId: string;
  columns?: Array<{
    name: string;
    color?: string;
    wipLimit?: number;
  }>;
}

@Injectable()
export class CreateBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepository: IBoardRepository,
  ) {}

  async execute(input: CreateBoardInput): Promise<BoardEntity> {
    console.log('🔍 [CreateBoardUseCase] Criando board:', input.name);

    try {
      // Criar board
      const board = BoardEntity.create({
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        workspaceId: input.workspaceId,
      });

      const savedBoard = await this.boardRepository.create(board);

      // Criar colunas padrão ou fornecidas
      const defaultColumns = input.columns || [
        { name: 'To Do', color: '#94a3b8' },
        { name: 'In Progress', color: '#3b82f6' },
        { name: 'Done', color: '#22c55e' },
      ];

      for (let i = 0; i < defaultColumns.length; i++) {
        const col = defaultColumns[i];
        const column = BoardColumnEntity.create({
          name: col.name,
          color: col.color,
          order: i,
          wipLimit: col.wipLimit,
          boardId: savedBoard.id,
        });

        await this.boardRepository.createColumn(column);
      }

      console.log('✅ [CreateBoardUseCase] Board criado:', savedBoard.id);
      return savedBoard;
    } catch (error) {
      console.error('❌ [CreateBoardUseCase] Erro ao criar board:', error);
      throw error;
    }
  }
}
