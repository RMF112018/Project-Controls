/**
 * Phase 1 Task 1 — Query-options factories for Estimating Tracker data.
 * Consumed by EstimatingDashboardPage, DepartmentTrackingPage, and
 * useEstimatingMutation for cache invalidation targets.
 */
import { queryOptions } from '@tanstack/react-query';
import type {
  IDataService,
  IEstimatingTracker,
  IListQueryOptions,
  IPagedResult,
} from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { stableFilterHash } from './stableFilterHash';

export function estimatingRecordsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  options?: IListQueryOptions,
) {
  const hash = stableFilterHash(options);
  return queryOptions<IPagedResult<IEstimatingTracker>>({
    queryKey: qk.estimating.records(scope, hash),
    queryFn: () => dataService.getEstimatingRecords(options),
    staleTime: QUERY_STALE_TIMES.estimating,
  });
}

export function estimatingRecordByIdOptions(
  scope: IQueryScope,
  id: number,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingTracker | null>({
    queryKey: qk.estimating.byId(scope, id),
    queryFn: () => dataService.getEstimatingRecordById(id),
    staleTime: QUERY_STALE_TIMES.estimating,
    enabled: id > 0,
  });
}

export function estimatingLogOptions(
  scope: IQueryScope,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.log(scope),
    queryFn: () => dataService.getEstimateLog(),
    staleTime: QUERY_STALE_TIMES.estimating,
  });
}

export function currentPursuitsOptions(
  scope: IQueryScope,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.pursuits(scope),
    queryFn: () => dataService.getCurrentPursuits(),
    staleTime: QUERY_STALE_TIMES.estimating,
  });
}

export function preconEngagementsOptions(
  scope: IQueryScope,
  dataService: IDataService,
) {
  return queryOptions<IEstimatingTracker[]>({
    queryKey: qk.estimating.engagements(scope),
    queryFn: () => dataService.getPreconEngagements(),
    staleTime: QUERY_STALE_TIMES.estimating,
  });
}
