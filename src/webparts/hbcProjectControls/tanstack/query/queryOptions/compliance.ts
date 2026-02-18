import { queryOptions } from '@tanstack/react-query';
import type { IComplianceEntry, IComplianceLogFilter, IComplianceSummary, IDataService } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { stableFilterHash } from './stableFilterHash';

export function complianceLogOptions(
  scope: IQueryScope,
  dataService: IDataService,
  filters: IComplianceLogFilter
) {
  const hash = stableFilterHash(filters);
  return queryOptions<IComplianceEntry[]>({
    queryKey: qk.compliance.log(scope, hash),
    queryFn: async () => dataService.getComplianceLog(filters),
    staleTime: QUERY_STALE_TIMES.compliance,
  });
}

export function complianceSummaryOptions(
  scope: IQueryScope,
  dataService: IDataService
) {
  return queryOptions<IComplianceSummary>({
    queryKey: qk.compliance.summary(scope),
    queryFn: async () => dataService.getComplianceSummary(),
    staleTime: QUERY_STALE_TIMES.compliance,
  });
}
