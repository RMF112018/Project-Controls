import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IBuyoutEntry, IContractTrackingApproval, IResolvedWorkflowStep, EntityType, WorkflowKey, IEntityChangedMessage } from '@hbc/sp-services';

export function useContractTracking() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshCallbackRef = React.useRef<(() => void) | null>(null);

  // SignalR: listen for ContractTracking entity changes
  useSignalR({
    entityType: EntityType.ContractTracking,
    onEntityChanged: React.useCallback(() => {
      refreshCallbackRef.current?.();
    }, []),
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
    setLoading(true);
    setError(null);
    try {
      const result = await dataService.submitContractTracking(projectCode, entryId, submittedBy);
      broadcastTrackingChange(entryId, 'updated', projectCode, 'Contract tracking submitted');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit for tracking';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService, broadcastTrackingChange]);

  const respondToTracking = React.useCallback(async (
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string
  ): Promise<IBuyoutEntry> => {
    setLoading(true);
    setError(null);
    try {
      const result = await dataService.respondToContractTracking(projectCode, entryId, approved, comment);
      broadcastTrackingChange(entryId, 'updated', projectCode, approved ? 'Contract tracking approved' : 'Contract tracking rejected');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to respond to tracking';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService, broadcastTrackingChange]);

  const getTrackingHistory = React.useCallback(async (
    projectCode: string,
    entryId: number
  ): Promise<IContractTrackingApproval[]> => {
    setError(null);
    try {
      return await dataService.getContractTrackingHistory(projectCode, entryId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load tracking history';
      setError(msg);
      throw err;
    }
  }, [dataService]);

  const resolveTrackingChain = React.useCallback(async (
    projectCode: string
  ): Promise<IResolvedWorkflowStep[]> => {
    setError(null);
    try {
      return await dataService.resolveWorkflowChain(WorkflowKey.CONTRACT_TRACKING, projectCode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve tracking chain';
      setError(msg);
      throw err;
    }
  }, [dataService]);

  return {
    loading,
    error,
    submitForTracking,
    respondToTracking,
    getTrackingHistory,
    resolveTrackingChain,
    setRefreshCallback: (cb: (() => void) | null) => { refreshCallbackRef.current = cb; },
  };
}
