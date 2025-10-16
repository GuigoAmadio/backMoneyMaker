import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum WorkspacePermission {
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
  EDIT_TRANSACTION = 'EDIT_TRANSACTION',
  DELETE_TRANSACTION = 'DELETE_TRANSACTION',
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  MANAGE_WORKSPACE = 'MANAGE_WORKSPACE',
  ALL = 'ALL',
}

export class AddMemberDto {
  @ApiProperty({
    description: 'ID do usuário a ser adicionado',
    example: 'user_123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Role do membro no workspace',
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
  })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;

  @ApiPropertyOptional({
    description: 'Permissões específicas do membro',
    enum: WorkspacePermission,
    isArray: true,
    example: [WorkspacePermission.CREATE_TRANSACTION, WorkspacePermission.VIEW_REPORTS],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkspacePermission, { each: true })
  permissions?: WorkspacePermission[];
}
