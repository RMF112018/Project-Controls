import { queryOptions } from '@tanstack/react-query';
import type { IProjectScheduleCriticalPath, IDataService } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function projectScheduleOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IProjectScheduleCriticalPath | null>({
    queryKey: qk.schedule.byProject(scope, projectCode),
    queryFn: async () => dataService.getProjectSchedule(projectCode),
    staleTime: QUERY_STALE_TIMES.schedule,
    enabled: !!projectCode,
  });
}
