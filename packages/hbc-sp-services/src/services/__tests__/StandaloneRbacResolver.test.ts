import { RoleName, PermissionLevel } from '../../models/enums';
import type { IRole } from '../../models/IRole';
import type { IPermissionTemplate, IProjectTeamAssignment, ISecurityGroupMapping } from '../../models/IPermissionTemplate';
import {
  buildStandaloneCurrentUser,
  resolveStandalonePermissions,
  resolveStandaloneRoles,
  type IStandaloneGraphMembership,
} from '../standalone/resolveStandaloneRoles';

function createRole(title: RoleName, principals: string[]): IRole {
  return {
    id: Math.floor(Math.random() * 10000),
    Title: title,
    UserOrGroup: principals,
    UserOrGroupIds: [],
    Permissions: [],
    IsActive: true,
  };
}

function createTemplate(id: number, name: string, toolKey: string): IPermissionTemplate {
  return {
    id,
    name,
    description: name,
    isGlobal: false,
    globalAccess: false,
    identityType: 'Internal',
    toolAccess: [{ toolKey, level: PermissionLevel.STANDARD, granularFlags: [] }],
    isDefault: false,
    isActive: true,
    version: 1,
    createdBy: 'test',
    createdDate: '2026-01-01T00:00:00.000Z',
    lastModifiedBy: 'test',
    lastModifiedDate: '2026-01-01T00:00:00.000Z',
  };
}

describe('Standalone RBAC resolver', () => {
  it('resolves roles from Graph group names and email fallback', () => {
    const roles: IRole[] = [
      createRole(RoleName.ExecutiveLeadership, ['hbc - executive leadership']),
      createRole(RoleName.BDRepresentative, ['bd.user@hbc.com']),
    ];

    const membership: IStandaloneGraphMembership = {
      groupIds: new Set<string>(['a-group-id']),
      groupNames: new Set<string>(['HBC - Executive Leadership']),
    };

    const resolved = resolveStandaloneRoles(roles, membership, 'bd.user@hbc.com');
    expect(resolved).toEqual(expect.arrayContaining([RoleName.ExecutiveLeadership, RoleName.BDRepresentative]));
  });

  it('builds current user permissions from resolved roles', () => {
    const roles: IRole[] = [createRole(RoleName.Marketing, ['hbc - marketing'])];
    const membership: IStandaloneGraphMembership = {
      groupIds: new Set<string>(),
      groupNames: new Set<string>(['hbc - marketing']),
    };

    const user = buildStandaloneCurrentUser(
      { id: 1, displayName: 'Test User', email: 'test@hbc.com', loginName: 'i:0#.f|membership|test@hbc.com' },
      roles,
      membership
    );

    expect(user.roles).toEqual([RoleName.Marketing]);
    expect(user.permissions.has('marketing:dashboard:view')).toBe(true);
  });

  it('resolves project override template and granular flags', async () => {
    const securityMappings: ISecurityGroupMapping[] = [
      { id: 1, securityGroupId: 'id-1', securityGroupName: 'HBC - Project Managers', defaultTemplateId: 4, isActive: true },
      { id: 2, securityGroupId: 'id-2', securityGroupName: 'HBC - Read Only', defaultTemplateId: 8, isActive: true },
    ];

    const defaultTemplate = createTemplate(4, 'Default Ops', 'schedule');
    const overrideTemplate = createTemplate(9, 'Override Ops', 'buyout_log');

    const assignments: IProjectTeamAssignment[] = [
      {
        id: 1,
        projectCode: '25-042-01',
        userId: 'u1',
        userDisplayName: 'User',
        userEmail: 'pm@hbc.com',
        assignedRole: RoleName.OperationsTeam,
        templateOverrideId: 9,
        granularFlagOverrides: [{ toolKey: 'buyout_log', flags: ['can_approve_compliance'] }],
        assignedBy: 'admin@hbc.com',
        assignedDate: '2026-01-01T00:00:00.000Z',
        isActive: true,
      },
    ];

    const dataService = {
      getSecurityGroupMappings: jest.fn().mockResolvedValue(securityMappings),
      getPermissionTemplate: jest.fn().mockImplementation(async (id: number) => (id === 9 ? overrideTemplate : defaultTemplate)),
      getProjectTeamAssignments: jest.fn().mockResolvedValue(assignments),
    };

    const resolved = await resolveStandalonePermissions({
      dataService,
      userEmail: 'pm@hbc.com',
      projectCode: '25-042-01',
      roles: [RoleName.OperationsTeam],
    });

    expect(resolved.source).toBe('ProjectOverride');
    expect(resolved.templateId).toBe(9);
    expect(resolved.granularFlags.buyout_log).toContain('can_approve_compliance');
  });

  it('falls back to unknown template when mapping cannot resolve', async () => {
    const dataService = {
      getSecurityGroupMappings: jest.fn().mockResolvedValue([]),
      getPermissionTemplate: jest.fn().mockResolvedValue(null),
      getProjectTeamAssignments: jest.fn().mockResolvedValue([]),
    };

    const resolved = await resolveStandalonePermissions({
      dataService,
      userEmail: 'readonly@hbc.com',
      projectCode: null,
      roles: [RoleName.RiskManagement],
    });

    expect(resolved.templateId).toBe(0);
    expect(resolved.permissions.size).toBe(0);
    expect(resolved.templateName).toBe('Unknown');
  });
});
