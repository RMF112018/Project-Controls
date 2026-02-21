import { queryOptions } from '@tanstack/react-query';
import type { ITurnoverAgenda, IResolvedWorkflowStep, IDataService } from '@hbc/sp-services';
import { WorkflowKey } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function turnoverAgendaOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<ITurnoverAgenda | null>({
    queryKey: qk.turnover.byProject(scope, projectCode),
    queryFn: async () => dataService.getTurnoverAgenda(projectCode),
    staleTime: QUERY_STALE_TIMES.turnover,
    enabled: !!projectCode,
  });
}

export function turnoverWorkflowChainOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IResolvedWorkflowStep[]>({
    queryKey: qk.turnover.workflowChain(scope, projectCode),
    queryFn: async () => dataService.resolveWorkflowChain(WorkflowKey.TURNOVER_APPROVAL, projectCode),
    staleTime: QUERY_STALE_TIMES.turnover,
    enabled: !!projectCode,
  });
}
