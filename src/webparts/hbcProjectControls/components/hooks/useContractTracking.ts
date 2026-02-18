import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IBuyoutEntry, IContractTrackingApproval, IResolvedWorkflowStep, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { buyoutTrackingChainOptions, buyoutTrackingHistoryOptions } from '../../tanstack/query/queryOptions/buyout';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export function useContractTracking() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [localError, setLocalError] = React.useState<string | null>(null);

  useSignalRQueryInvalidation({
    entityType: EntityType.ContractTracking,
    queryKeys: [qk.buyout.base(scope)],
  });

  const submitMutation = useMutation({
    mutationFn: async (vars: { projectCode: string; entryId: number; submittedBy: string }): Promise<IBuyoutEntry> =>
      dataService.submitContractTracking(vars.projectCode, vars.entryId, vars.submittedBy),
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
    }): Promise<IBuyoutEntry> =>
      dataService.respondToContractTracking(vars.projectCode, vars.entryId, vars.approved, vars.comment),
    onSuccess: async (_result, vars) => {
      await queryClient.invalidateQueries({ queryKey: qk.buyout.entries(scope, vars.projectCode) });
    },
  });

  const broadcastTrackingChange = React.useCallback((
    entryId: number,
    action: IEntityChangedMessage['action'],
    projectCode: string,
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.ContractTracking,
      entityId: String(entryId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      projectCode,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const submitForTracking = React.useCallback(async (
    projectCode: string,
    entryId: number,
    submittedBy: string
  ): Promise<IBuyoutEntry> => {
    setLocalError(null);
    try {
      const result = await submitMutation.mutateAsync({ projectCode, entryId, submittedBy });
      broadcastTrackingChange(entryId, 'updated', projectCode, 'Contract tracking submitted');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit for tracking';
      setLocalError(msg);
      throw err;
    }
  }, [submitMutation, broadcastTrackingChange, dataService]);

  const respondToTracking = React.useCallback(async (
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string
  ): Promise<IBuyoutEntry> => {
    setLocalError(null);
    try {
      const result = await respondMutation.mutateAsync({ projectCode, entryId, approved, comment });
      broadcastTrackingChange(entryId, 'updated', projectCode, approved ? 'Contract tracking approved' : 'Contract tracking rejected');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to respond to tracking';
      setLocalError(msg);
      throw err;
    }
  }, [respondMutation, broadcastTrackingChange, dataService]);

  const getTrackingHistory = React.useCallback(async (
    projectCode: string,
    entryId: number
  ): Promise<IContractTrackingApproval[]> => {
    setLocalError(null);
    try {
      return await queryClient.fetchQuery(buyoutTrackingHistoryOptions(scope, dataService, projectCode, entryId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load tracking history';
      setLocalError(msg);
      throw err;
    }
  }, [queryClient, scope, dataService]);

  const resolveTrackingChain = React.useCallback(async (
    projectCode: string
  ): Promise<IResolvedWorkflowStep[]> => {
    setLocalError(null);
    try {
      return await queryClient.fetchQuery(buyoutTrackingChainOptions(scope, dataService, projectCode));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve tracking chain';
      setLocalError(msg);
      throw err;
    }
  }, [queryClient, scope, dataService]);

  const loading = submitMutation.isPending || respondMutation.isPending;
  const error = localError;

  return {
    loading,
    error,
    submitForTracking,
    respondToTracking,
    getTrackingHistory,
    resolveTrackingChain,
    setRefreshCallback: (_cb: (() => void) | null) => { /* compatibility no-op */ },
  };
}
