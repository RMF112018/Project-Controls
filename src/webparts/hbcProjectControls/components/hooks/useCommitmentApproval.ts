import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IBuyoutEntry, ICommitmentApproval, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

export function useCommitmentApproval() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Callers can pass onRefresh via the returned hook to trigger data reload
  const refreshCallbackRef = React.useRef<(() => void) | null>(null);

  // SignalR: listen for RiskCost entity changes (commitment approvals)
  useSignalR({
    entityType: EntityType.RiskCost,
    onEntityChanged: React.useCallback(() => {
      refreshCallbackRef.current?.();
    }, []),
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
    setLoading(true);
    setError(null);
    try {
      const result = await dataService.submitCommitmentForApproval(projectCode, entryId, submittedBy);
      broadcastCommitmentChange(entryId, 'updated', projectCode, 'Commitment submitted for approval');
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit commitment';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService, broadcastCommitmentChange]);

  const respondToApproval = React.useCallback(async (
    projectCode: string,
    entryId: number,
    approved: boolean,
    comment: string,
    escalate?: boolean
  ): Promise<IBuyoutEntry> => {
    setLoading(true);
    setError(null);
    try {
      const result = await dataService.respondToCommitmentApproval(projectCode, entryId, approved, comment, escalate);
      broadcastCommitmentChange(entryId, 'updated', projectCode, approved ? 'Commitment approved' : 'Commitment rejected');
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to respond to approval';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService, broadcastCommitmentChange]);

  const getApprovalHistory = React.useCallback(async (
    projectCode: string,
    entryId: number
  ): Promise<ICommitmentApproval[]> => {
    setError(null);
    try {
      return await dataService.getCommitmentApprovalHistory(projectCode, entryId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load approval history';
      setError(msg);
      throw err;
    }
  }, [dataService]);

  return {
    loading,
    error,
    submitForApproval,
    respondToApproval,
    getApprovalHistory,
    /** Set a callback to be invoked when SignalR receives commitment changes */
    setRefreshCallback: (cb: (() => void) | null) => { refreshCallbackRef.current = cb; },
  };
}
