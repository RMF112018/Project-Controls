/**
 * HBC-PC-UUID-001 — Query-options factories for project UUID resolution.
 * Consumed by ProjectHubProvider and useCurrentProject hook.
 */
import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IActiveProject, ILead } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

/** Resolve an active project by its immutable UUID. */
export function activeProjectByUuidOptions(
  scope: IQueryScope,
  uuid: string,
  dataService: IDataService,
) {
  return queryOptions<IActiveProject | null>({
    queryKey: [...qk.scope(scope), 'projectByUuid', uuid] as const,
    queryFn: () => dataService.getActiveProjectByUuid(uuid),
    staleTime: QUERY_STALE_TIMES.reference,
    enabled: !!uuid,
  });
}

/** Resolve a lead by its immutable UUID. */
export function leadByUuidOptions(
  scope: IQueryScope,
  uuid: string,
  dataService: IDataService,
) {
  return queryOptions<ILead | null>({
    queryKey: [...qk.scope(scope), 'leadByUuid', uuid] as const,
    queryFn: () => dataService.getLeadByUuid(uuid),
    staleTime: QUERY_STALE_TIMES.reference,
    enabled: !!uuid,
  });
}
