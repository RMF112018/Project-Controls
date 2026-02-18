import { queryOptions } from '@tanstack/react-query';
import type {
  IBuyoutEntry,
  ICommitmentApproval,
  IContractTrackingApproval,
  IDataService,
  IResolvedWorkflowStep,
} from '@hbc/sp-services';
import { WorkflowKey } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';

export function buyoutEntriesOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IBuyoutEntry[]>({
    queryKey: qk.buyout.entries(scope, projectCode),
    queryFn: async () => dataService.getBuyoutEntries(projectCode),
    staleTime: QUERY_STALE_TIMES.buyout,
  });
}

export function buyoutApprovalHistoryOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string,
  entryId: number
) {
  return queryOptions<ICommitmentApproval[]>({
    queryKey: qk.buyout.approvalHistory(scope, projectCode, entryId),
    queryFn: async () => dataService.getCommitmentApprovalHistory(projectCode, entryId),
    staleTime: QUERY_STALE_TIMES.buyout,
  });
}

export function buyoutTrackingHistoryOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string,
  entryId: number
) {
  return queryOptions<IContractTrackingApproval[]>({
    queryKey: qk.buyout.trackingHistory(scope, projectCode, entryId),
    queryFn: async () => dataService.getContractTrackingHistory(projectCode, entryId),
    staleTime: QUERY_STALE_TIMES.buyout,
  });
}

export function buyoutTrackingChainOptions(
  scope: IQueryScope,
  dataService: IDataService,
  projectCode: string
) {
  return queryOptions<IResolvedWorkflowStep[]>({
    queryKey: qk.buyout.trackingChain(scope, projectCode),
    queryFn: async () => dataService.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode),
    staleTime: QUERY_STALE_TIMES.buyout,
  });
}
