export interface BoardProps {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BoardEntity {
  private constructor(private props: BoardProps) {}

  static create(props: Omit<BoardProps, 'id' | 'createdAt' | 'updatedAt'>): BoardEntity {
    return new BoardEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: BoardProps): BoardEntity {
    return new BoardEntity(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
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
      throw new Error('Board name cannot be empty');
    }
    this.props.name = name.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  updateColor(color?: string): void {
    this.props.color = color;
    this.touch();
  }

  updateIcon(icon?: string): void {
    this.props.icon = icon;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): BoardProps {
    return { ...this.props };
  }
}

