import { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from './useSignalR';
import {
  IProjectDataMart,
  IDataMartFilter,
  IDataMartSyncResult,
  DataMartHealthStatus,
  EntityType,
} from '@hbc/sp-services';

export interface IUseDataMartResult {
  records: IProjectDataMart[];
  isLoading: boolean;
  error: string | null;
  fetchRecords: (filters?: IDataMartFilter) => Promise<void>;
  getRecord: (projectCode: string) => Promise<IProjectDataMart | null>;
  syncProject: (projectCode: string) => Promise<void>;
  syncAll: () => Promise<void>;
  healthDistribution: Record<DataMartHealthStatus, number>;
  alertCount: number;
}

export function useDataMart(): IUseDataMartResult {
  const { dataService } = useAppContext();

  const [records, setRecords] = useState<IProjectDataMart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (filters?: IDataMartFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getDataMartRecords(filters);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Data Mart records');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const getRecord = useCallback(async (projectCode: string): Promise<IProjectDataMart | null> => {
    setError(null);
    try {
      return await dataService.getDataMartRecord(projectCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Data Mart record');
      return null;
    }
  }, [dataService]);

  const syncProject = useCallback(async (projectCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result: IDataMartSyncResult = await dataService.syncToDataMart(projectCode);
      if (!result.success) {
        setError(result.error || 'Sync failed');
      }
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync project to Data Mart');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, fetchRecords]);

  const syncAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await dataService.triggerDataMartSync();
      await fetchRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger Data Mart sync');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, fetchRecords]);

  // Real-time refresh on DataMart entity changes
  useSignalR({
    entityType: EntityType.DataMart,
    onEntityChanged: () => {
      fetchRecords().catch(() => { /* silent refresh */ });
    },
  });

  // Computed values
  const healthDistribution: Record<DataMartHealthStatus, number> = {
    Green: records.filter(r => r.overallHealth === 'Green').length,
    Yellow: records.filter(r => r.overallHealth === 'Yellow').length,
    Red: records.filter(r => r.overallHealth === 'Red').length,
  };

  const alertCount = records.filter(
    r => r.hasUnbilledAlert || r.hasScheduleAlert || r.hasFeeErosionAlert
  ).length;

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    getRecord,
    syncProject,
    syncAll,
    healthDistribution,
    alertCount,
  };
}
