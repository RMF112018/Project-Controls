import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IPermissionTemplate, IProjectTeamAssignment, ISecurityGroupMapping } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function permissionTemplatesOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IPermissionTemplate[]>({
    queryKey: qk.permission.templates(scope),
    queryFn: async () => dataService.getPermissionTemplates(),
    staleTime: QUERY_STALE_TIMES.permissions,
  });
}

export function permissionMappingsOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<ISecurityGroupMapping[]>({
    queryKey: qk.permission.mappings(scope),
    queryFn: async () => dataService.getSecurityGroupMappings(),
    staleTime: QUERY_STALE_TIMES.permissions,
  });
}

export function permissionAssignmentsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode?: string
) {
  return queryOptions<IProjectTeamAssignment[]>({
    queryKey: qk.permission.assignments(scope, projectCode),
    queryFn: async () => {
      if (projectCode) {
        return dataService.getProjectTeamAssignments(projectCode);
      }
      return dataService.getAllProjectTeamAssignments();
    },
    staleTime: QUERY_STALE_TIMES.permissions,
  });
}
