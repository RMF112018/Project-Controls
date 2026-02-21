import { queryOptions } from '@tanstack/react-query';
import type { IEstimatingTracker, IDataService, IListQueryOptions } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { stableFilterHash } from './stableFilterHash';

export function estimatingRecordsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  options?: IListQueryOptions
) {
  const hash = stableFilterHash(options);
  return queryOptions<{ items: IEstimatingTracker[]; totalCount: number }>({
    queryKey: qk.estimating.records(scope, hash),
    queryFn: async () => dataService.getEstimatingRecords(options),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}

export function currentPursuitsOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.pursuits(scope),
    queryFn: async () => dataService.getCurrentPursuits(),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}

export function preconEngagementsOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.engagements(scope),
    queryFn: async () => dataService.getPreconEngagements(),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}

export function estimateLogOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.log(scope),
    queryFn: async () => dataService.getEstimateLog(),
    staleTime: QUERY_STALE_TIMES.projectOperational,
  });
}
