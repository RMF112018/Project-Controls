import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IEstimatingTracker, IListQueryOptions, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { estimatingRecordsOptions, currentPursuitsOptions, preconEngagementsOptions, estimateLogOptions } from '../../tanstack/query/queryOptions/estimating';
import { qk } from '../../tanstack/query/queryKeys';

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

type FetchMode =
  | { type: 'records'; options?: IListQueryOptions }
  | { type: 'pursuits' }
  | { type: 'engagements' }
  | { type: 'log' };

export function useEstimating(): IUseEstimatingResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();

  const [fetchMode, setFetchMode] = React.useState<FetchMode>({ type: 'records' });

  const recordsQuery = useQuery({
    ...estimatingRecordsOptions(scope, dataService, fetchMode.type === 'records' ? fetchMode.options : undefined),
    enabled: fetchMode.type === 'records',
  });

  const pursuitsQuery = useQuery({
    ...currentPursuitsOptions(scope, dataService),
    enabled: fetchMode.type === 'pursuits',
  });

  const engagementsQuery = useQuery({
    ...preconEngagementsOptions(scope, dataService),
    enabled: fetchMode.type === 'engagements',
  });

  const logQuery = useQuery({
    ...estimateLogOptions(scope, dataService),
    enabled: fetchMode.type === 'log',
  });

  const { records, totalCount, isLoading, error } = React.useMemo(() => {
    if (fetchMode.type === 'records') {
      return {
        records: recordsQuery.data?.items ?? [],
        totalCount: recordsQuery.data?.totalCount ?? 0,
        isLoading: recordsQuery.isLoading,
        error: recordsQuery.error?.message ?? null,
      };
    }
    if (fetchMode.type === 'pursuits') {
      const items = pursuitsQuery.data ?? [];
      return { records: items, totalCount: items.length, isLoading: pursuitsQuery.isLoading, error: pursuitsQuery.error?.message ?? null };
    }
    if (fetchMode.type === 'engagements') {
      const items = engagementsQuery.data ?? [];
      return { records: items, totalCount: items.length, isLoading: engagementsQuery.isLoading, error: engagementsQuery.error?.message ?? null };
    }
    // log
    const items = logQuery.data ?? [];
    return { records: items, totalCount: items.length, isLoading: logQuery.isLoading, error: logQuery.error?.message ?? null };
  }, [fetchMode, recordsQuery, pursuitsQuery, engagementsQuery, logQuery]);

  // SignalR: invalidate all estimating queries on entity changes
  useSignalRQueryInvalidation({
    entityType: EntityType.Estimate,
    queryKeys: React.useMemo(() => [qk.estimating.base(scope)], [scope]),
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
    getStateKey: () => qk.estimating.base(scope),
    applyOptimistic: (previous, data) => [{ id: -Date.now(), ...data } as IEstimatingTracker, ...(previous ?? [])],
    onSuccessEffects: async (record) => {
      broadcastEstimateChange(record.id, 'created', 'Estimate record created');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
    },
  });

  const updateRecordMutation = useHbcOptimisticMutation<IEstimatingTracker, { id: number; data: Partial<IEstimatingTracker> }, IEstimatingTracker[]>({
    method: 'updateEstimatingRecord',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.estimating,
    mutationFn: async ({ id, data }) => dataService.updateEstimatingRecord(id, data),
    getStateKey: () => qk.estimating.base(scope),
    applyOptimistic: (previous, vars) => (previous ?? []).map((record) => record.id === vars.id ? { ...record, ...vars.data } : record),
    onSuccessEffects: async (_updated, vars) => {
      broadcastEstimateChange(vars.id, 'updated', 'Estimate record updated');
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
    },
  });

  const createRecord = React.useCallback(async (data: Partial<IEstimatingTracker>) => {
    return createRecordMutation.mutateAsync(data);
  }, [createRecordMutation]);

  const updateRecord = React.useCallback(async (id: number, data: Partial<IEstimatingTracker>) => {
    return updateRecordMutation.mutateAsync({ id, data });
  }, [updateRecordMutation]);

  const fetchRecords = React.useCallback(async (options?: IListQueryOptions) => {
    setFetchMode({ type: 'records', options });
    await queryClient.invalidateQueries({ queryKey: qk.estimating.base(scope) });
  }, [queryClient, scope]);

  const fetchCurrentPursuits = React.useCallback(async () => {
    setFetchMode({ type: 'pursuits' });
  }, []);

  const fetchPreconEngagements = React.useCallback(async () => {
    setFetchMode({ type: 'engagements' });
  }, []);

  const fetchEstimateLog = React.useCallback(async () => {
    setFetchMode({ type: 'log' });
  }, []);

  return { records, totalCount, isLoading, error, fetchRecords, getRecordById, getRecordByLeadId, createRecord, updateRecord, fetchCurrentPursuits, fetchPreconEngagements, fetchEstimateLog };
}
