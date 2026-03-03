import type {
  ICurrentUser,
  IRole,
  IFeatureFlag,
  IPermissionTemplate,
  ISecurityGroupMapping,
  IProjectTeamAssignment,
  IResolvedPermissions,
} from '@hbc/models';

/**
 * Auth & permissions repository — users, roles, feature flags, permission templates.
 */
export interface IAuthRepository {
  // RBAC
  getCurrentUser(): Promise<ICurrentUser>;
  getRoles(): Promise<IRole[]>;
  updateRole(id: number, data: Partial<IRole>): Promise<IRole>;

  // Feature Flags
  getFeatureFlags(): Promise<IFeatureFlag[]>;
  updateFeatureFlag(id: number, data: Partial<IFeatureFlag>): Promise<IFeatureFlag>;

  // Permission Templates
  getPermissionTemplates(): Promise<IPermissionTemplate[]>;
  getPermissionTemplate(id: number): Promise<IPermissionTemplate | null>;
  createPermissionTemplate(data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate>;
  updatePermissionTemplate(id: number, data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate>;
  deletePermissionTemplate(id: number): Promise<void>;

  // Security Group Mappings
  getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]>;
  createSecurityGroupMapping(data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping>;
  updateSecurityGroupMapping(id: number, data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping>;

  // Project Team Assignments
  getProjectTeamAssignments(projectCode: string): Promise<IProjectTeamAssignment[]>;
  getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]>;
  getMyProjectAssignments(userEmail: string): Promise<IProjectTeamAssignment[]>;
  createProjectTeamAssignment(data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment>;
  updateProjectTeamAssignment(id: number, data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment>;
  removeProjectTeamAssignment(id: number): Promise<void>;
  inviteToProjectSiteGroup(projectCode: string, userEmail: string, role: string): Promise<void>;

  // Permission Resolution
  resolveUserPermissions(userEmail: string, projectCode: string | null): Promise<IResolvedPermissions>;
  getAccessibleProjects(userEmail: string): Promise<string[]>;
}
