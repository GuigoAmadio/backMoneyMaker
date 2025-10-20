export interface WorkspaceProps {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  clientId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceEntity {
  private constructor(private props: WorkspaceProps) {}

  static create(props: Omit<WorkspaceProps, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntity {
    // Validações
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Workspace name cannot be empty');
    }

    return new WorkspaceEntity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: WorkspaceProps): WorkspaceEntity {
    return new WorkspaceEntity(props);
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

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get createdBy(): string {
    return this.props.createdBy;
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
      throw new Error('Workspace name cannot be empty');
    }
    this.props.name = name.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  makePublic(): void {
    this.props.isPublic = true;
    this.touch();
  }

  makePrivate(): void {
    this.props.isPublic = false;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject(): WorkspaceProps {
    return { ...this.props };
  }
}
