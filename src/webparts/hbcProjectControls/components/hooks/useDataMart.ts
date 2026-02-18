import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import {
  IProjectDataMart,
  IDataMartFilter,
  IDataMartSyncResult,
  DataMartHealthStatus,
  EntityType,
} from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { dataMartRecordOptions, dataMartRecordsOptions } from '../../tanstack/query/queryOptions/dataMart';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

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
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<IDataMartFilter | undefined>(undefined);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const recordsQuery = useQuery(dataMartRecordsOptions(scope, dataService, filters));

  const syncProjectMutation = useMutation({
    mutationFn: async (projectCode: string): Promise<IDataMartSyncResult> => dataService.syncToDataMart(projectCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.dataMart.base(scope) });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async (): Promise<IDataMartSyncResult[]> => dataService.triggerDataMartSync(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.dataMart.base(scope) });
    },
  });

  const fetchRecords = React.useCallback(async (nextFilters?: IDataMartFilter) => {
    setLocalError(null);
    setFilters(nextFilters);
    try {
      await queryClient.fetchQuery(dataMartRecordsOptions(scope, dataService, nextFilters));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch Data Mart records');
    }
  }, [queryClient, scope, dataService]);

  const getRecord = React.useCallback(async (projectCode: string): Promise<IProjectDataMart | null> => {
    setLocalError(null);
    try {
      return await queryClient.fetchQuery(dataMartRecordOptions(scope, dataService, projectCode));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch Data Mart record');
      return null;
    }
  }, [queryClient, scope, dataService]);

  const syncProject = React.useCallback(async (projectCode: string) => {
    setLocalError(null);
    try {
      const result = await syncProjectMutation.mutateAsync(projectCode);
      if (!result.success) {
        setLocalError(result.error || 'Sync failed');
      }
      await queryClient.invalidateQueries({ queryKey: qk.dataMart.base(scope) });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to sync project to Data Mart');
    }
  }, [syncProjectMutation, queryClient, scope]);

  const syncAll = React.useCallback(async () => {
    setLocalError(null);
    try {
      await syncAllMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: qk.dataMart.base(scope) });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to trigger Data Mart sync');
    }
  }, [syncAllMutation, queryClient, scope]);

  useSignalRQueryInvalidation({
    entityType: EntityType.DataMart,
    queryKeys: [qk.dataMart.base(scope)],
  });

  const records = React.useMemo(() => recordsQuery.data ?? [], [recordsQuery.data]);
  const queryError = recordsQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);
  const isLoading =
    recordsQuery.isFetching ||
    syncProjectMutation.isPending ||
    syncAllMutation.isPending;

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
