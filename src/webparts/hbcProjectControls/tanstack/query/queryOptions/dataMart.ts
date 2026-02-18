import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IDataMartFilter, IProjectDataMart } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { stableFilterHash } from './stableFilterHash';

export function dataMartRecordsOptions(
  scope: IQueryScope,
  dataService: IDataService,
  filters?: IDataMartFilter
) {
  const hash = stableFilterHash(filters);
  return queryOptions<IProjectDataMart[]>({
    queryKey: qk.dataMart.records(scope, hash),
    queryFn: async () => dataService.getDataMartRecords(filters),
    staleTime: QUERY_STALE_TIMES.dataMart,
  });
}

export function dataMartRecordOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IProjectDataMart | null>({
    queryKey: qk.dataMart.record(scope, projectCode),
    queryFn: async () => dataService.getDataMartRecord(projectCode),
    staleTime: QUERY_STALE_TIMES.dataMart,
  });
}
