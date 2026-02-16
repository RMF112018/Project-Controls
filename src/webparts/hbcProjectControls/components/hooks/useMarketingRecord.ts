import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IMarketingProjectRecord, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseMarketingRecordResult {
  record: IMarketingProjectRecord | null;
  allRecords: IMarketingProjectRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRecord: (projectCode: string) => Promise<void>;
  fetchAllRecords: () => Promise<void>;
  updateRecord: (projectCode: string, data: Partial<IMarketingProjectRecord>) => Promise<IMarketingProjectRecord>;
  createRecord: (data: Partial<IMarketingProjectRecord>) => Promise<IMarketingProjectRecord>;
}

export function useMarketingRecord(): IUseMarketingRecordResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [record, setRecord] = React.useState<IMarketingProjectRecord | null>(null);
  const [allRecords, setAllRecords] = React.useState<IMarketingProjectRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAllRecords = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getAllMarketingProjectRecords();
      setAllRecords(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on ProjectRecord entity changes
  useSignalR({
    entityType: EntityType.ProjectRecord,
    onEntityChanged: React.useCallback(() => { fetchAllRecords(); }, [fetchAllRecords]),
  });

  const broadcastRecordChange = React.useCallback((
    recordId: string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.ProjectRecord,
      entityId: recordId,
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchRecord = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getMarketingProjectRecord(projectCode);
      setRecord(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch record');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const updateRecord = React.useCallback(async (projectCode: string, data: Partial<IMarketingProjectRecord>) => {
    const updated = await dataService.updateMarketingProjectRecord(projectCode, data);
    setRecord(updated);
    setAllRecords(prev => prev.map(r => r.projectCode === projectCode ? updated : r));
    broadcastRecordChange(projectCode, 'updated', 'Marketing record updated');
    return updated;
  }, [dataService, broadcastRecordChange]);

  const createRecord = React.useCallback(async (data: Partial<IMarketingProjectRecord>) => {
    const created = await dataService.createMarketingProjectRecord(data);
    setRecord(created);
    setAllRecords(prev => [...prev, created]);
    broadcastRecordChange(created.projectCode, 'created', 'Marketing record created');
    return created;
  }, [dataService, broadcastRecordChange]);

  return { record, allRecords, isLoading, error, fetchRecord, fetchAllRecords, updateRecord, createRecord };
}
