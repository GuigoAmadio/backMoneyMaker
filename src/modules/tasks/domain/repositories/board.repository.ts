import { BoardEntity } from '../entities/board.entity';
import { BoardColumnEntity } from '../entities/board-column.entity';

export interface IBoardRepository {
  create(board: BoardEntity): Promise<BoardEntity>;
  update(board: BoardEntity): Promise<BoardEntity>;
  findById(id: string): Promise<BoardEntity | null>;
  findByWorkspace(workspaceId: string): Promise<BoardEntity[]>;
  delete(id: string): Promise<void>;

  // Column operations
  createColumn(column: BoardColumnEntity): Promise<BoardColumnEntity>;
  updateColumn(column: BoardColumnEntity): Promise<BoardColumnEntity>;
  findColumnById(id: string): Promise<BoardColumnEntity | null>;
  findColumnsByBoard(boardId: string): Promise<BoardColumnEntity[]>;
  deleteColumn(id: string): Promise<void>;
  reorderColumns(boardId: string, columnOrders: { id: string; order: number }[]): Promise<void>;
}

