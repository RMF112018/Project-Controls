import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IBuyoutEntry, ICommitmentApproval, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { buyoutApprovalHistoryOptions } from '../../tanstack/query/queryOptions/buyout';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export function useCommitmentApproval() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [localError, setLocalError] = React.useState<string | null>(null);

  useSignalRQueryInvalidation({
    entityType: EntityType.RiskCost,
    queryKeys: [qk.buyout.base(scope)],
  });

  const submitMutation = useMutation({
    mutationFn: async (vars: { projectCode: string; entryId: number; submittedBy: string }): Promise<IBuyoutEntry> =>
      dataService.submitCommitmentForApproval(vars.projectCode, vars.entryId, vars.submittedBy),
    onSuccess: async (_result, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.buyout.entries(scope, vars.projectCode) });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async (vars: {
      projectCode: string;
      entryId: number;
      approved: boolean;
      comment: string;
      escalate?: boolean;
    }): Promise<IBuyoutEntry> =>
      dataService.respondToCommitmentApproval(vars.projectCode, vars.entryId, vars.approved, vars.comment, vars.escalate),
    onSuccess: async (_result, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.buyout.entries(scope, vars.projectCode) });
    },
  });

  const broadcastCommitmentChange = React.useCallback((
    entryId: number,
    action: IEntityChangedMessage['action'],
    projectCode: string,
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.RiskCost,
      entityId: String(entryId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      projectCode,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const submitForApproval = React.useCallback(async (
    projectCode: string,
    entryId: number,
    submittedBy: string
  ): Promise<IBuyoutEntry> => {
    setLocalError(null);
    try {
      const result = await submitMutation.mutateAsync({ projectCode, entryId, submittedBy });
      broadcastCommitmentChange(entryId, 'updated', projectCode, 'Commitment submitted for approval');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit commitment';
      setLocalError(msg);
      throw err;
    }
  }, [submitMutation, broadcastCommitmentChange, dataService]);

  const respondToApproval = React.useCallback(async (
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string,
    escalate?: boolean
  ): Promise<IBuyoutEntry> => {
    setLocalError(null);
    try {
      const result = await respondMutation.mutateAsync({ projectCode, entryId, approved, comment, escalate });
      broadcastCommitmentChange(entryId, 'updated', projectCode, approved ? 'Commitment approved' : 'Commitment rejected');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to respond to approval';
      setLocalError(msg);
      throw err;
    }
  }, [respondMutation, broadcastCommitmentChange, dataService]);

  const getApprovalHistory = React.useCallback(async (
    projectCode: string,
    entryId: number
  ): Promise<ICommitmentApproval[]> => {
    setLocalError(null);
    try {
      return await queryClient.fetchQuery(buyoutApprovalHistoryOptions(scope, dataService, projectCode, entryId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load approval history';
      setLocalError(msg);
      throw err;
    }
  }, [queryClient, scope, dataService]);

  const error = localError;
  const loading = submitMutation.isPending || respondMutation.isPending;

  return {
    loading,
    error,
    submitForApproval,
    respondToApproval,
    getApprovalHistory,
    setRefreshCallback: (_cb: (() => void) | null) => { /* compatibility no-op */ },
  };
}
