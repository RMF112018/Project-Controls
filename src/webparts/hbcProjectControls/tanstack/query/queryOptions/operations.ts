import { queryOptions } from '@tanstack/react-query';
import type { IActiveProject, ICloseoutItem, IDataService, IStartupChecklistItem } from '@hbc/sp-services';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';

export function activeProjectsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  filtersHash = 'all'
) {
  return queryOptions<IActiveProject[]>({
    queryKey: qk.activeProjects.list(scope, filtersHash),
    queryFn: async () => dataService.getActiveProjects(),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}

export function startupChecklistOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IStartupChecklistItem[]>({
    queryKey: qk.startupChecklist.base(scope, projectCode),
    queryFn: async () => dataService.getStartupChecklist(projectCode),
    staleTime: QUERY_STALE_TIMES.closeout,
    enabled: !!projectCode,
  });
}

export function closeoutItemsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ICloseoutItem[]>({
    queryKey: qk.closeout.byProject(scope, projectCode),
    queryFn: async () => dataService.getCloseoutItems(projectCode),
    staleTime: QUERY_STALE_TIMES.closeout,
    enabled: !!projectCode,
  });
}
