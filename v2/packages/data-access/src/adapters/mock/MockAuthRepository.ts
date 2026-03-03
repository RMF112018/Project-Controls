import type {
  ICurrentUser,
  IRole,
  IFeatureFlag,
  IPermissionTemplate,
  ISecurityGroupMapping,
  IProjectTeamAssignment,
  IResolvedPermissions,
} from '@hbc/models';
import type { IAuthRepository } from '../../ports/IAuthRepository';

const MOCK_USER: ICurrentUser = {
  id: 1,
  displayName: 'Demo User',
  email: 'demo.user@hedrickbrothers.com',
  loginName: 'demo.user@hedrickbrothers.com',
  roles: ['Executive Leadership', 'SharePoint Admin'] as unknown as ICurrentUser['roles'],
  isSiteAdmin: true,
};

export class MockAuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<ICurrentUser> { return { ...MOCK_USER }; }
  async getRoles(): Promise<IRole[]> { return []; }
  async updateRole(_id: number, _data: Partial<IRole>): Promise<IRole> { throw new Error('Not implemented'); }
  async getFeatureFlags(): Promise<IFeatureFlag[]> { return []; }
  async updateFeatureFlag(_id: number, _data: Partial<IFeatureFlag>): Promise<IFeatureFlag> { throw new Error('Not implemented'); }
  async getPermissionTemplates(): Promise<IPermissionTemplate[]> { return []; }
  async getPermissionTemplate(_id: number): Promise<IPermissionTemplate | null> { return null; }
  async createPermissionTemplate(_data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> { throw new Error('Not implemented'); }
  async updatePermissionTemplate(_id: number, _data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> { throw new Error('Not implemented'); }
  async deletePermissionTemplate(_id: number): Promise<void> {}
  async getSecurityGroupMappings(): Promise<ISecurityGroupMapping[]> { return []; }
  async createSecurityGroupMapping(_data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> { throw new Error('Not implemented'); }
  async updateSecurityGroupMapping(_id: number, _data: Partial<ISecurityGroupMapping>): Promise<ISecurityGroupMapping> { throw new Error('Not implemented'); }
  async getProjectTeamAssignments(_projectCode: string): Promise<IProjectTeamAssignment[]> { return []; }
  async getAllProjectTeamAssignments(): Promise<IProjectTeamAssignment[]> { return []; }
  async getMyProjectAssignments(_userEmail: string): Promise<IProjectTeamAssignment[]> { return []; }
  async createProjectTeamAssignment(_data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> { throw new Error('Not implemented'); }
  async updateProjectTeamAssignment(_id: number, _data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> { throw new Error('Not implemented'); }
  async removeProjectTeamAssignment(_id: number): Promise<void> {}
  async inviteToProjectSiteGroup(_projectCode: string, _userEmail: string, _role: string): Promise<void> {}
  async resolveUserPermissions(_userEmail: string, _projectCode: string | null): Promise<IResolvedPermissions> {
    return {
      userId: MOCK_USER.email,
      projectCode: _projectCode,
      templateId: 1,
      templateName: 'Admin',
      source: 'DirectAssignment',
      toolLevels: {},
      granularFlags: {},
      permissions: new Set(['*']),
      globalAccess: true,
    };
  }
  async getAccessibleProjects(_userEmail: string): Promise<string[]> { return ['HBC-2024-001', 'HBC-2024-002']; }
}
