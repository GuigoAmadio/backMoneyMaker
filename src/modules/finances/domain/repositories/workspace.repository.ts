import { WorkspaceEntity } from '../entities/workspace.entity';

export interface IWorkspaceRepository {
  create(workspace: WorkspaceEntity): Promise<WorkspaceEntity>;
  update(workspace: WorkspaceEntity): Promise<WorkspaceEntity>;
  findById(id: string): Promise<WorkspaceEntity | null>;
  findByClient(clientId: string): Promise<WorkspaceEntity[]>;
  findByUser(clientId: string, userId: string): Promise<WorkspaceEntity[]>;
  delete(id: string): Promise<void>;
  addMember(workspaceId: string, userId: string, role: string): Promise<any>;
  removeMember(workspaceId: string, memberId: string): Promise<void>;
  getMembers(workspaceId: string): Promise<any[]>;
  updateMemberRole(memberId: string, role: string): Promise<any>;
  checkMembership(workspaceId: string, userId: string): Promise<boolean>;
  checkPermission(workspaceId: string, userId: string, permission: string): Promise<boolean>;
}
