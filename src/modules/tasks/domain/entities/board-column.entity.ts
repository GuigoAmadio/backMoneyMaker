export interface BoardColumnProps {
  id: string;
  name: string;
  color?: string;
  order: number;
  wipLimit?: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BoardColumnEntity {
  private constructor(private props: BoardColumnProps) {}

  static create(
    props: Omit<BoardColumnProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): BoardColumnEntity {
    return new BoardColumnEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BoardColumnProps): BoardColumnEntity {
    return new BoardColumnEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get order(): number {
    return this.props.order;
  }

  get wipLimit(): number | undefined {
    return this.props.wipLimit;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Column name cannot be empty');
    }
    this.props.name = name.trim();
    this.touch();
  }

  updateColor(color?: string): void {
    this.props.color = color;
    this.touch();
  }

  updateOrder(order: number): void {
    if (order < 0) {
      throw new Error('Order cannot be negative');
    }
    this.props.order = order;
    this.touch();
  }

  setWipLimit(limit?: number): void {
    if (limit !== undefined && limit < 0) {
      throw new Error('WIP limit cannot be negative');
    }
    this.props.wipLimit = limit;
    this.touch();
  }

  isWipLimitExceeded(currentTaskCount: number): boolean {
    if (!this.props.wipLimit) {
      return false;
    }
    return currentTaskCount >= this.props.wipLimit;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): BoardColumnProps {
    return { ...this.props };
  }
}

