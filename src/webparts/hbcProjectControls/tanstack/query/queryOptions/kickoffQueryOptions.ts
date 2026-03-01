/**
 * Stage 8 — Query-options factories for Estimating Kickoff data.
 * Consumed by EstimatingKickoffPage and DepartmentTrackingPage.
 */
import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IEstimatingKickoff } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function kickoffByProjectOptions(
  scope: IQueryScope,
  projectCode: string,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingKickoff | null>({
    queryKey: qk.kickoff.byProject(scope, projectCode),
    queryFn: () => dataService.getEstimatingKickoff(projectCode),
    staleTime: QUERY_STALE_TIMES.kickoff,
    enabled: !!projectCode,
  });
}

export function kickoffByLeadIdOptions(
  scope: IQueryScope,
  leadId: number,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingKickoff | null>({
    queryKey: qk.kickoff.byLeadId(scope, leadId),
    queryFn: () => dataService.getEstimatingKickoffByLeadId(leadId),
    staleTime: QUERY_STALE_TIMES.kickoff,
    enabled: leadId > 0,
  });
}
