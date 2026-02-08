import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IBuyoutEntry } from '../../models/IBuyoutEntry';
import { ICommitmentApproval } from '../../models/ICommitmentApproval';

export function useCommitmentApproval() {
  const { dataService } = useAppContext();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submitForApproval = React.useCallback(async (
    projectCode: string,
    entryId: number,
    submittedBy: string
  ): Promise<IBuyoutEntry> => {
    setLoading(true);
    setError(null);
    try {
      const result = await dataService.submitCommitmentForApproval(projectCode, entryId, submittedBy);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit commitment';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService]);

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
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to respond to approval';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataService]);

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
  };
}
