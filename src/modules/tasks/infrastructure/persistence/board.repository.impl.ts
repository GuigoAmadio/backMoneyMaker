import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IBoardRepository } from '../../domain/repositories/board.repository';
import { BoardEntity } from '../../domain/entities/board.entity';
import { BoardColumnEntity } from '../../domain/entities/board-column.entity';
import { Board, BoardColumn, Prisma } from '@prisma/client';

@Injectable()
export class BoardRepositoryImpl implements IBoardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(board: BoardEntity): Promise<BoardEntity> {
    const data: Prisma.BoardCreateInput = {
      id: board.id,
      name: board.name,
      description: board.description,
      color: board.color,
      icon: board.icon,
      workspace: { connect: { id: board.workspaceId } },
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };

    const created = await this.prisma.board.create({ data });
    return this.toDomain(created);
  }

  async update(board: BoardEntity): Promise<BoardEntity> {
    const data: Prisma.BoardUpdateInput = {
      name: board.name,
      description: board.description,
      color: board.color,
      icon: board.icon,
      updatedAt: board.updatedAt,
    };

    const updated = await this.prisma.board.update({
      where: { id: board.id },
      data,
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<BoardEntity | null> {
    const board = await this.prisma.board.findUnique({
      where: { id },
    });

    return board ? this.toDomain(board) : null;
  }

  async findByWorkspace(workspaceId: string): Promise<BoardEntity[]> {
    const boards = await this.prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return boards.map((b) => this.toDomain(b));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.board.delete({ where: { id } });
  }

  // Column operations

  async createColumn(column: BoardColumnEntity): Promise<BoardColumnEntity> {
    const data: Prisma.BoardColumnCreateInput = {
      id: column.id,
      name: column.name,
      color: column.color,
      order: column.order,
      wipLimit: column.wipLimit,
      board: { connect: { id: column.boardId } },
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
    };

    const created = await this.prisma.boardColumn.create({ data });
    return this.toColumnDomain(created);
  }

  async updateColumn(column: BoardColumnEntity): Promise<BoardColumnEntity> {
    const data: Prisma.BoardColumnUpdateInput = {
      name: column.name,
      color: column.color,
      order: column.order,
      wipLimit: column.wipLimit,
      updatedAt: column.updatedAt,
    };

    const updated = await this.prisma.boardColumn.update({
      where: { id: column.id },
      data,
    });

    return this.toColumnDomain(updated);
  }

  async findColumnById(id: string): Promise<BoardColumnEntity | null> {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
    });

    return column ? this.toColumnDomain(column) : null;
  }

  async findColumnsByBoard(boardId: string): Promise<BoardColumnEntity[]> {
    const columns = await this.prisma.boardColumn.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    });

    return columns.map((c) => this.toColumnDomain(c));
  }

  async deleteColumn(id: string): Promise<void> {
    await this.prisma.boardColumn.delete({ where: { id } });
  }

  async reorderColumns(
    boardId: string,
    columnOrders: { id: string; order: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      columnOrders.map(({ id, order }) =>
        this.prisma.boardColumn.update({
          where: { id },
          data: { order },
        }),
      ),
    );
  }

  private toDomain(board: Board): BoardEntity {
    return BoardEntity.reconstitute({
      id: board.id,
      name: board.name,
      description: board.description || undefined,
      color: board.color || undefined,
      icon: board.icon || undefined,
      workspaceId: board.workspaceId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  }

  private toColumnDomain(column: BoardColumn): BoardColumnEntity {
    return BoardColumnEntity.reconstitute({
      id: column.id,
      name: column.name,
      color: column.color || undefined,
      order: column.order,
      wipLimit: column.wipLimit || undefined,
      boardId: column.boardId,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
    });
  }
}
