import { queryOptions } from '@tanstack/react-query';
import type { ILead, IDataService, IListQueryOptions, Stage } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { stableFilterHash } from './stableFilterHash';

export function leadsListOptions(
  scope: IQueryScope,
  dataService: IDataService,
  options?: IListQueryOptions
) {
  const hash = stableFilterHash(options);
  return queryOptions<{ items: ILead[]; totalCount: number }>({
    queryKey: qk.leads.list(scope, hash),
    queryFn: async () => dataService.getLeads(options),
    staleTime: QUERY_STALE_TIMES.leads,
  });
}

export function leadsByStageOptions(
  scope: IQueryScope,
  dataService: IDataService,
  stage: Stage
) {
  return queryOptions<ILead[]>({
    queryKey: qk.leads.byStage(scope, stage),
    queryFn: async () => dataService.getLeadsByStage(stage),
    staleTime: QUERY_STALE_TIMES.leads,
  });
}

export function leadsSearchOptions(
  scope: IQueryScope,
  dataService: IDataService,
  query: string
) {
  return queryOptions<ILead[]>({
    queryKey: qk.leads.search(scope, query),
    queryFn: async () => dataService.searchLeads(query),
    staleTime: QUERY_STALE_TIMES.leads,
    enabled: query.length > 0,
  });
}

export function leadByIdOptions(
  scope: IQueryScope,
  dataService: IDataService,
  id: number
) {
  return queryOptions<ILead | null>({
    queryKey: qk.leads.byId(scope, id),
    queryFn: async () => dataService.getLeadById(id),
    staleTime: QUERY_STALE_TIMES.leads,
    enabled: id > 0,
  });
}
