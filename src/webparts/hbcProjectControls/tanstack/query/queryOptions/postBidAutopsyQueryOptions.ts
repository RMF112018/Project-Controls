/**
 * Stage 21 — Query-options factories for Post-Bid Autopsy data.
 * Consumed by PostBidAutopsyPage.
 */
import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IPostBidAutopsy } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function postBidAutopsyByProjectOptions(
  scope: IQueryScope,
  projectCode: string,
  dataService: IDataService,
) {
  return queryOptions<IPostBidAutopsy | null>({
    queryKey: qk.postBidAutopsy.byProject(scope, projectCode),
    queryFn: () => dataService.getPostBidAutopsy(projectCode),
    staleTime: QUERY_STALE_TIMES.postBidAutopsy, // 5 minutes
    enabled: !!projectCode,
  });
}

export function postBidAutopsyByLeadIdOptions(
  scope: IQueryScope,
  leadId: number,
  dataService: IDataService,
) {
  return queryOptions<IPostBidAutopsy | null>({
    queryKey: qk.postBidAutopsy.byLeadId(scope, leadId),
    queryFn: () => dataService.getPostBidAutopsyByLeadId(leadId),
    staleTime: QUERY_STALE_TIMES.postBidAutopsy,
    enabled: leadId > 0,
  });
}
