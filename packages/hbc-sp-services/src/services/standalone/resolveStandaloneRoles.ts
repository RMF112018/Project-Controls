import { RoleName, PermissionLevel } from '../../models/enums';
import type { ICurrentUser, IRole } from '../../models/IRole';
import type {
  IProjectTeamAssignment,
  IResolvedPermissions,
  ISecurityGroupMapping,
  IToolAccess,
  IPermissionTemplate,
} from '../../models/IPermissionTemplate';
import type { IDataService } from '../IDataService';
import { ROLE_PERMISSIONS } from '../../utils/permissions';
import { TOOL_DEFINITIONS, resolveToolPermissions } from '../../utils/toolPermissionMap';

export interface IStandaloneGraphMembership {
  groupIds: ReadonlySet<string>;
  groupNames: ReadonlySet<string>;
}

export interface IStandaloneUserIdentity {
  id: number;
  displayName: string;
  email: string;
  loginName: string;
}

const ROLE_TO_SECURITY_GROUP: Record<RoleName, string> = {
  [RoleName.ExecutiveLeadership]: 'HBC - Executive Leadership',
  [RoleName.DepartmentDirector]: 'HBC - Project Executives',
  [RoleName.OperationsTeam]: 'HBC - Project Managers',
  [RoleName.PreconstructionTeam]: 'HBC - Estimating',
  [RoleName.BDRepresentative]: 'HBC - Business Development',
  [RoleName.EstimatingCoordinator]: 'HBC - Estimating',
  [RoleName.AccountingManager]: 'HBC - Accounting',
  [RoleName.Legal]: 'HBC - Read Only',
  [RoleName.RiskManagement]: 'HBC - Read Only',
  [RoleName.Marketing]: 'HBC - Read Only',
  [RoleName.QualityControl]: 'HBC - Read Only',
  [RoleName.Safety]: 'HBC - Read Only',
  [RoleName.IDS]: 'HBC - Read Only',
  [RoleName.SharePointAdmin]: 'HBC - SharePoint Admins',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toLowerSet(values: ReadonlySet<string>): Set<string> {
  return new Set(Array.from(values, normalize));
}

function cloneToolAccess(toolAccess: IToolAccess[]): IToolAccess[] {
  return toolAccess.map((tool) => ({
    ...tool,
    granularFlags: tool.granularFlags ? [...tool.granularFlags] : [],
  }));
}

function mergeGranularFlagOverrides(toolAccess: IToolAccess[], assignment: IProjectTeamAssignment | null): void {
  if (!assignment?.granularFlagOverrides) return;

  for (const override of assignment.granularFlagOverrides) {
    const target = toolAccess.find((ta) => ta.toolKey === override.toolKey);
    if (!target) continue;
    const merged = new Set<string>([...(target.granularFlags ?? []), ...override.flags]);
    target.granularFlags = Array.from(merged);
  }
}

function buildRolePermissions(roles: RoleName[]): Set<string> {
  const permissions = new Set<string>();
  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
    rolePermissions.forEach((perm) => permissions.add(perm));
  }
  return permissions;
}

function isRoleMatch(
  role: IRole,
  graphGroupIds: Set<string>,
  graphGroupNames: Set<string>,
  email: string
): boolean {
  if (!role.IsActive) return false;

  const principals = (role.UserOrGroup ?? []).map(normalize);
  const principalIds = (role.UserOrGroupIds ?? []).map((id) => normalize(String(id)));

  return principals.some((principal) => {
    if (principal === email) return true;
    if (graphGroupIds.has(principal)) return true;
    if (graphGroupNames.has(principal)) return true;
    return false;
  }) || principalIds.some((id) => graphGroupIds.has(id));
}

export function resolveStandaloneRoles(
  roleRows: IRole[],
  graphMembership: IStandaloneGraphMembership,
  email: string
): RoleName[] {
  const normalizedEmail = normalize(email);
  const graphGroupIds = toLowerSet(graphMembership.groupIds);
  const graphGroupNames = toLowerSet(graphMembership.groupNames);

  const resolvedRoles = new Set<RoleName>();
  for (const role of roleRows) {
    if (isRoleMatch(role, graphGroupIds, graphGroupNames, normalizedEmail)) {
      resolvedRoles.add(role.Title);
    }
  }

  return Array.from(resolvedRoles);
}

export function buildStandaloneCurrentUser(
  identity: IStandaloneUserIdentity,
  roleRows: IRole[],
  graphMembership: IStandaloneGraphMembership
): ICurrentUser {
  const roles = resolveStandaloneRoles(roleRows, graphMembership, identity.email);
  return {
    id: identity.id,
    displayName: identity.displayName,
    email: identity.email,
    loginName: identity.loginName,
    roles,
    permissions: buildRolePermissions(roles),
  };
}

function getDefaultTemplateId(roles: RoleName[], mappings: ISecurityGroupMapping[]): number {
  for (const role of roles) {
    const groupName = ROLE_TO_SECURITY_GROUP[role];
    if (!groupName) continue;
    const match = mappings.find((mapping) => mapping.isActive && mapping.securityGroupName === groupName);
    if (match) return match.defaultTemplateId;
  }

  const readOnly = mappings.find((mapping) => mapping.isActive && mapping.securityGroupName === 'HBC - Read Only');
  return readOnly?.defaultTemplateId ?? 0;
}

async function findProjectAssignment(
  dataService: Pick<IDataService, 'getProjectTeamAssignments'>,
  projectCode: string,
  email: string
): Promise<IProjectTeamAssignment | null> {
  const assignments = await dataService.getProjectTeamAssignments(projectCode);
  const normalizedEmail = normalize(email);
  return assignments.find((assignment) => assignment.isActive && normalize(assignment.userEmail) === normalizedEmail) ?? null;
}

function buildResolvedPermissions(
  userEmail: string,
  projectCode: string | null,
  source: IResolvedPermissions['source'],
  template: IPermissionTemplate | null,
  toolAccess: IToolAccess[]
): IResolvedPermissions {
  if (!template) {
    return {
      userId: userEmail,
      projectCode,
      templateId: 0,
      templateName: 'Unknown',
      source,
      toolLevels: {},
      granularFlags: {},
      permissions: new Set<string>(),
      globalAccess: false,
    };
  }

  const permissionStrings = resolveToolPermissions(toolAccess, TOOL_DEFINITIONS);
  const toolLevels: Record<string, PermissionLevel> = {};
  const granularFlags: Record<string, string[]> = {};

  for (const tool of toolAccess) {
    toolLevels[tool.toolKey] = tool.level;
    if (tool.granularFlags && tool.granularFlags.length > 0) {
      granularFlags[tool.toolKey] = tool.granularFlags;
    }
  }

  return {
    userId: userEmail,
    projectCode,
    templateId: template.id,
    templateName: template.name,
    source,
    toolLevels,
    granularFlags,
    permissions: new Set<string>(permissionStrings),
    globalAccess: template.globalAccess,
  };
}

export async function resolveStandalonePermissions(params: {
  dataService: Pick<IDataService, 'getSecurityGroupMappings' | 'getPermissionTemplate' | 'getProjectTeamAssignments'>;
  userEmail: string;
  projectCode: string | null;
  roles: RoleName[];
}): Promise<IResolvedPermissions> {
  const { dataService, userEmail, projectCode, roles } = params;
  const mappings = await dataService.getSecurityGroupMappings();
  const defaultTemplateId = getDefaultTemplateId(roles, mappings);

  let source: IResolvedPermissions['source'] = 'SecurityGroupDefault';
  let templateId = defaultTemplateId;
  let projectAssignment: IProjectTeamAssignment | null = null;

  if (projectCode) {
    projectAssignment = await findProjectAssignment(dataService, projectCode, userEmail);
    if (projectAssignment?.templateOverrideId) {
      templateId = projectAssignment.templateOverrideId;
      source = 'ProjectOverride';
    }
  }

  const template = templateId ? await dataService.getPermissionTemplate(templateId) : null;
  const toolAccess = template ? cloneToolAccess(template.toolAccess) : [];

  mergeGranularFlagOverrides(toolAccess, projectAssignment);

  return buildResolvedPermissions(userEmail, projectCode, source, template, toolAccess);
}
