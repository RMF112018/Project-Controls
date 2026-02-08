import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IMarketingProjectRecord } from '../../models/IMarketingProjectRecord';

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
  const { dataService } = useAppContext();
  const [record, setRecord] = React.useState<IMarketingProjectRecord | null>(null);
  const [allRecords, setAllRecords] = React.useState<IMarketingProjectRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const updateRecord = React.useCallback(async (projectCode: string, data: Partial<IMarketingProjectRecord>) => {
    const updated = await dataService.updateMarketingProjectRecord(projectCode, data);
    setRecord(updated);
    setAllRecords(prev => prev.map(r => r.projectCode === projectCode ? updated : r));
    return updated;
  }, [dataService]);

  const createRecord = React.useCallback(async (data: Partial<IMarketingProjectRecord>) => {
    const created = await dataService.createMarketingProjectRecord(data);
    setRecord(created);
    setAllRecords(prev => [...prev, created]);
    return created;
  }, [dataService]);

  return { record, allRecords, isLoading, error, fetchRecord, fetchAllRecords, updateRecord, createRecord };
}
