import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IEstimatingTracker, IListQueryOptions, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';

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
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const [records, setRecords] = React.useState<IEstimatingTracker[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const estimatingCacheKey = React.useMemo(() => ['local', 'estimating'] as const, []);

  const fetchRecords = React.useCallback(async (options?: IListQueryOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getEstimatingRecords(options);
      setRecords(result.items);
      setTotalCount(result.totalCount);
      queryClient.setQueryData<IEstimatingTracker[]>(estimatingCacheKey, result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, estimatingCacheKey, queryClient]);

  // SignalR: refresh on Estimate entity changes
  useSignalR({
    entityType: EntityType.Estimate,
    onEntityChanged: React.useCallback(() => { fetchRecords(); }, [fetchRecords]),
  });

  const broadcastEstimateChange = React.useCallback((
    recordId: number,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Estimate,
      entityId: String(recordId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const getRecordById = React.useCallback(async (id: number) => {
    return dataService.getEstimatingRecordById(id);
  }, [dataService]);

  const getRecordByLeadId = React.useCallback(async (leadId: number) => {
    return dataService.getEstimatingByLeadId(leadId);
  }, [dataService]);

  const createRecordMutation = useHbcOptimisticMutation<IEstimatingTracker, Partial<IEstimatingTracker>, IEstimatingTracker[]>({
    method: 'createEstimatingRecord',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.estimating,
    mutationFn: async (data) => dataService.createEstimatingRecord(data),
    getStateKey: () => estimatingCacheKey,
    applyOptimistic: (previous, data) => [{ id: -Date.now(), ...data } as IEstimatingTracker, ...(previous ?? [])],
    onOptimisticStateChange: (state) => {
      const next = state ?? [];
      setRecords(next);
      setTotalCount(next.length);
    },
    onSuccessEffects: async (record) => {
      setRecords((prev) => [record, ...prev.filter((item) => item.id > 0)]);
      setTotalCount((prev) => prev + 1);
      broadcastEstimateChange(record.id, 'created', 'Estimate record created');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: estimatingCacheKey });
    },
  });

  const updateRecordMutation = useHbcOptimisticMutation<IEstimatingTracker, { id: number; data: Partial<IEstimatingTracker> }, IEstimatingTracker[]>({
    method: 'updateEstimatingRecord',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.estimating,
    mutationFn: async ({ id, data }) => dataService.updateEstimatingRecord(id, data),
    getStateKey: () => estimatingCacheKey,
    applyOptimistic: (previous, vars) => (previous ?? []).map((record) => record.id === vars.id ? { ...record, ...vars.data } : record),
    onOptimisticStateChange: (state) => setRecords(state ?? []),
    onSuccessEffects: async (updated, vars) => {
      setRecords((prev) => prev.map((record) => record.id === vars.id ? updated : record));
      broadcastEstimateChange(vars.id, 'updated', 'Estimate record updated');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: estimatingCacheKey });
    },
  });

  const createRecord = React.useCallback(async (data: Partial<IEstimatingTracker>) => {
    return createRecordMutation.mutateAsync(data);
  }, [createRecordMutation]);

  const updateRecord = React.useCallback(async (id: number, data: Partial<IEstimatingTracker>) => {
    return updateRecordMutation.mutateAsync({ id, data });
  }, [updateRecordMutation]);

  const fetchCurrentPursuits = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getCurrentPursuits();
      setRecords(items);
      setTotalCount(items.length);
      queryClient.setQueryData<IEstimatingTracker[]>(estimatingCacheKey, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pursuits');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, estimatingCacheKey, queryClient]);

  const fetchPreconEngagements = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getPreconEngagements();
      setRecords(items);
      setTotalCount(items.length);
      queryClient.setQueryData<IEstimatingTracker[]>(estimatingCacheKey, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch engagements');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, estimatingCacheKey, queryClient]);

  const fetchEstimateLog = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getEstimateLog();
      setRecords(items);
      setTotalCount(items.length);
      queryClient.setQueryData<IEstimatingTracker[]>(estimatingCacheKey, items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch log');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, estimatingCacheKey, queryClient]);

  return { records, totalCount, isLoading, error, fetchRecords, getRecordById, getRecordByLeadId, createRecord, updateRecord, fetchCurrentPursuits, fetchPreconEngagements, fetchEstimateLog };
}
