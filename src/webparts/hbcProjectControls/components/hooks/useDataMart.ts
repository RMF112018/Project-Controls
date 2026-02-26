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

interface IDataMartMutationContext {
  snapshots: Array<[ReadonlyArray<unknown>, unknown]>;
}

function isDataMartRecord(value: unknown): value is IProjectDataMart {
  return !!value && typeof value === 'object' && 'projectCode' in value;
}

function applyProjectSyncOptimistic(
  value: unknown,
  projectCode: string,
  syncBy: string
): unknown {
  const now = new Date().toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!isDataMartRecord(item) || item.projectCode !== projectCode) {
        return item;
      }
      return {
        ...item,
        lastSyncBy: syncBy,
        lastSyncDate: now,
      };
    });
  }

  if (isDataMartRecord(value) && value.projectCode === projectCode) {
    return {
      ...value,
      lastSyncBy: syncBy,
      lastSyncDate: now,
    };
  }

  return value;
}

function applySyncAllOptimistic(value: unknown, syncBy: string): unknown {
  const now = new Date().toISOString();
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    if (!isDataMartRecord(item)) {
      return item;
    }
    return {
      ...item,
      lastSyncBy: syncBy,
      lastSyncDate: now,
    };
  });
}

export function useDataMart(): IUseDataMartResult {
  const { dataService, currentUser } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<IDataMartFilter | undefined>(undefined);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const optimisticSyncBy = currentUser?.email ?? 'sync-pending';

  const recordsQuery = useQuery(dataMartRecordsOptions(scope, dataService, filters));
  const invalidateDataMartQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.dataMart.base(scope) });
  }, [queryClient, scope]);

  const syncProjectMutation = useMutation<IDataMartSyncResult, Error, string, IDataMartMutationContext>({
    mutationFn: async (projectCode: string): Promise<IDataMartSyncResult> => dataService.syncToDataMart(projectCode),
    onMutate: async (projectCode) => {
      await queryClient.cancelQueries({ queryKey: qk.dataMart.base(scope) });

      const snapshots = queryClient.getQueriesData<unknown>({
        queryKey: qk.dataMart.base(scope),
      });

      queryClient.setQueriesData<unknown>(
        { queryKey: qk.dataMart.base(scope) },
        (previous: unknown) => applyProjectSyncOptimistic(previous, projectCode, optimisticSyncBy)
      );

      return { snapshots };
    },
    onError: (_error, _projectCode, context) => {
      setLocalError('Failed to sync project to Data Mart');
      context?.snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: async () => {
      await invalidateDataMartQueries();
    },
  });

  const syncAllMutation = useMutation<IDataMartSyncResult[], Error, void, IDataMartMutationContext>({
    mutationFn: async (): Promise<IDataMartSyncResult[]> => dataService.triggerDataMartSync(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qk.dataMart.base(scope) });

      const snapshots = queryClient.getQueriesData<unknown>({
        queryKey: qk.dataMart.base(scope),
      });

      queryClient.setQueriesData<unknown>(
        { queryKey: qk.dataMart.base(scope) },
        (previous: unknown) => applySyncAllOptimistic(previous, optimisticSyncBy)
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      setLocalError('Failed to trigger Data Mart sync');
      context?.snapshots.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSettled: async () => {
      await invalidateDataMartQueries();
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
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to sync project to Data Mart');
    }
  }, [syncProjectMutation]);

  const syncAll = React.useCallback(async () => {
    setLocalError(null);
    try {
      await syncAllMutation.mutateAsync();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to trigger Data Mart sync');
    }
  }, [syncAllMutation]);

  useSignalRQueryInvalidation({
    entityType: EntityType.DataMart,
    queryKeys: React.useMemo(() => [qk.dataMart.base(scope)], [scope]),
  });

  const records = React.useMemo(() => recordsQuery.data ?? [], [recordsQuery.data]);
  const queryError = recordsQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);
  const isLoading =
    recordsQuery.isFetching ||
    syncProjectMutation.isPending ||
    syncAllMutation.isPending;

  // Computed values
  const healthDistribution = React.useMemo<Record<DataMartHealthStatus, number>>(() => ({
    Green: records.filter(r => r.overallHealth === 'Green').length,
    Yellow: records.filter(r => r.overallHealth === 'Yellow').length,
    Red: records.filter(r => r.overallHealth === 'Red').length,
  }), [records]);

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
