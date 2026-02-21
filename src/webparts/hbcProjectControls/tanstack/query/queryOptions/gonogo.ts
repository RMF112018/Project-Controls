import { queryOptions } from '@tanstack/react-query';
import type { IGoNoGoScorecard, IScorecardVersion, IDataService } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function scorecardsListOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IGoNoGoScorecard[]>({
    queryKey: qk.gonogo.scorecards(scope),
    queryFn: async () => dataService.getScorecards(),
    staleTime: QUERY_STALE_TIMES.gonogo,
  });
}

export function scorecardByLeadOptions(
  scope: IQueryScope,
  dataService: IDataService,
  leadId: number
) {
  return queryOptions<IGoNoGoScorecard | null>({
    queryKey: qk.gonogo.byLeadId(scope, leadId),
    queryFn: async () => dataService.getScorecardByLeadId(leadId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: leadId > 0,
  });
}

export function scorecardVersionsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  scorecardId: number
) {
  return queryOptions<IScorecardVersion[]>({
    queryKey: qk.gonogo.versions(scope, scorecardId),
    queryFn: async () => dataService.getScorecardVersions(scorecardId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: scorecardId > 0,
  });
}
