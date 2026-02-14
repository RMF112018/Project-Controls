import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IEstimatingTracker, IListQueryOptions } from '@hbc/sp-services';

interface IUseEstimatingResult {
  records: IEstimatingTracker[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  fetchRecords: (options?: IListQueryOptions) => Promise<void>;
  getRecordById: (id: number) => Promise<IEstimatingTracker | null>;
  getRecordByLeadId: (leadId: number) => Promise<IEstimatingTracker | null>;
  createRecord: (data: Partial<IEstimatingTracker>) => Promise<IEstimatingTracker>;
  updateRecord: (id: number, data: Partial<IEstimatingTracker>) => Promise<IEstimatingTracker>;
  fetchCurrentPursuits: () => Promise<void>;
  fetchPreconEngagements: () => Promise<void>;
  fetchEstimateLog: () => Promise<void>;
}

export function useEstimating(): IUseEstimatingResult {
  const { dataService } = useAppContext();
  const [records, setRecords] = React.useState<IEstimatingTracker[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRecords = React.useCallback(async (options?: IListQueryOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getEstimatingRecords(options);
      setRecords(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const getRecordById = React.useCallback(async (id: number) => {
    return dataService.getEstimatingRecordById(id);
  }, [dataService]);

  const getRecordByLeadId = React.useCallback(async (leadId: number) => {
    return dataService.getEstimatingByLeadId(leadId);
  }, [dataService]);

  const createRecord = React.useCallback(async (data: Partial<IEstimatingTracker>) => {
    const record = await dataService.createEstimatingRecord(data);
    setRecords(prev => [...prev, record]);
    setTotalCount(prev => prev + 1);
    return record;
  }, [dataService]);

  const updateRecord = React.useCallback(async (id: number, data: Partial<IEstimatingTracker>) => {
    const updated = await dataService.updateEstimatingRecord(id, data);
    setRecords(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }, [dataService]);

  const fetchCurrentPursuits = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getCurrentPursuits();
      setRecords(items);
      setTotalCount(items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pursuits');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchPreconEngagements = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getPreconEngagements();
      setRecords(items);
      setTotalCount(items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch engagements');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchEstimateLog = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getEstimateLog();
      setRecords(items);
      setTotalCount(items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch log');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  return { records, totalCount, isLoading, error, fetchRecords, getRecordById, getRecordByLeadId, createRecord, updateRecord, fetchCurrentPursuits, fetchPreconEngagements, fetchEstimateLog };
}
