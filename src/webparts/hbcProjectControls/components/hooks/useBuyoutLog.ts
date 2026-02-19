import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IBuyoutEntry, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { useHbcOptimisticMutation } from '../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../tanstack/query/mutations/optimisticMutationFlags';
import { useInfiniteSharePointList } from '../../tanstack/query/useInfiniteSharePointList';
import {
  appendBuyoutEntryOptimistic,
  removeBuyoutEntryOptimistic,
  replaceBuyoutEntryOptimistic,
} from '../../tanstack/query/mutations/optimisticPatchers';

export interface IBuyoutMetrics {
  totalOriginalBudget: number;
  totalAwardedValue: number;
  totalOverUnder: number;
  procurementProgress: number;
  totalDivisions: number;
  awardedDivisions: number;
}

export function useBuyoutLog() {
  const { dataService, currentUser, isFeatureEnabled } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const infiniteEnabled =
    isFeatureEnabled('InfinitePagingEnabled') &&
    isFeatureEnabled('InfinitePaging_OpsLogs') &&
    typeof dataService.getBuyoutEntriesPage === 'function';
  const paged = useInfiniteSharePointList<IBuyoutEntry>({
    infiniteEnabled,
    enabled: !!activeProjectCode,
    queryKey: qk.buyout.infinite(scope, activeProjectCode ?? ''),
    fetchPage: ({ token, pageSize }) =>
      dataService.getBuyoutEntriesPage({
        pageSize,
        token,
        projectCode: activeProjectCode ?? '',
      }),
    fetchAll: () => dataService.getBuyoutEntries(activeProjectCode ?? ''),
    pageSize: 100,
  });

  const getListStateKey = React.useCallback((projectCode: string) => {
    if (infiniteEnabled) {
      return qk.buyout.infinite(scope, projectCode);
    }
    return [...qk.buyout.infinite(scope, projectCode), 'full'] as const;
  }, [infiniteEnabled, scope]);

  useSignalRQueryInvalidation({
    entityType: EntityType.RiskCost,
    queryKeys: [qk.buyout.base(scope)],
    onInvalidated: () => {
      if (activeProjectCode) {
        void queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, activeProjectCode) });
      }
    },
  });

  const broadcastBuyoutChange = React.useCallback((
    projectCode: string,
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.RiskCost,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode,
    });
  }, [broadcastChange, currentUser]);

  const initializeLogMutation = useMutation({
    mutationFn: async (projectCode: string): Promise<IBuyoutEntry[]> => dataService.initializeBuyoutLog(projectCode),
    onSuccess: async (data, projectCode) => {
      queryClient.setQueryData(qk.buyout.entries(scope, projectCode), data);
      await queryClient.invalidateQueries({ queryKey: qk.buyout.entries(scope, projectCode) });
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, projectCode) });
      }
    },
  });

  const addEntryMutation = useHbcOptimisticMutation<IBuyoutEntry, { projectCode: string; entry: Partial<IBuyoutEntry> }, IBuyoutEntry[]>({
    method: 'addBuyoutEntry',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.buyout,
    mutationFn: async (vars) =>
      dataService.addBuyoutEntry(vars.projectCode, vars.entry),
    getStateKey: (vars) => getListStateKey(vars.projectCode),
    applyOptimistic: (previous, vars) => {
      const now = new Date().toISOString();
      const optimisticEntry: IBuyoutEntry = {
        id: -Date.now(),
        projectCode: vars.projectCode,
        divisionCode: vars.entry.divisionCode ?? 'TEMP',
        divisionDescription: vars.entry.divisionDescription ?? 'Pending',
        isStandard: vars.entry.isStandard ?? false,
        originalBudget: vars.entry.originalBudget ?? 0,
        estimatedTax: vars.entry.estimatedTax ?? 0,
        totalBudget: vars.entry.totalBudget ?? ((vars.entry.originalBudget ?? 0) + (vars.entry.estimatedTax ?? 0)),
        enrolledInSDI: vars.entry.enrolledInSDI ?? false,
        bondRequired: vars.entry.bondRequired ?? false,
        commitmentStatus: vars.entry.commitmentStatus ?? 'Budgeted',
        waiverRequired: vars.entry.waiverRequired ?? false,
        approvalHistory: vars.entry.approvalHistory ?? [],
        status: vars.entry.status ?? 'Not Started',
        createdDate: vars.entry.createdDate ?? now,
        modifiedDate: vars.entry.modifiedDate ?? now,
        ...vars.entry,
      };
      return appendBuyoutEntryOptimistic(previous ?? [], optimisticEntry);
    },
    onSuccess: async (created, vars) => {
      const key = getListStateKey(vars.projectCode);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) => appendBuyoutEntryOptimistic((prev ?? []).filter((entry) => entry.id > 0), created));
      await queryClient.invalidateQueries({ queryKey: key });
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, vars.projectCode) });
      }
    },
  });

  const updateEntryMutation = useHbcOptimisticMutation<IBuyoutEntry, { projectCode: string; entryId: number; data: Partial<IBuyoutEntry> }, IBuyoutEntry[]>({
    method: 'updateBuyoutEntry',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.buyout,
    mutationFn: async (vars) =>
      dataService.updateBuyoutEntry(vars.projectCode, vars.entryId, vars.data),
    getStateKey: (vars) => getListStateKey(vars.projectCode),
    applyOptimistic: (previous, vars) => {
      return replaceBuyoutEntryOptimistic(previous ?? [], vars.entryId, vars.data);
    },
    onSuccess: async (updated, vars) => {
      const key = getListStateKey(vars.projectCode);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) => replaceBuyoutEntryOptimistic(prev ?? [], vars.entryId, updated));
      await queryClient.invalidateQueries({ queryKey: key });
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, vars.projectCode) });
      }
    },
  });

  const removeEntryMutation = useHbcOptimisticMutation<void, { projectCode: string; entryId: number }, IBuyoutEntry[]>({
    method: 'removeBuyoutEntry',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.buyout,
    mutationFn: async (vars) =>
      dataService.removeBuyoutEntry(vars.projectCode, vars.entryId),
    getStateKey: (vars) => getListStateKey(vars.projectCode),
    applyOptimistic: (previous, vars) => {
      return removeBuyoutEntryOptimistic(previous ?? [], vars.entryId);
    },
    onSuccess: async (_result, vars) => {
      await queryClient.invalidateQueries({ queryKey: getListStateKey(vars.projectCode) });
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, vars.projectCode) });
      }
    },
  });

  const fetchEntries = React.useCallback(async (projectCode: string) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.buyout.infinite(scope, projectCode) });
        await queryClient.refetchQueries({ queryKey: qk.buyout.infinite(scope, projectCode), type: 'active' });
      } else {
        await queryClient.fetchQuery({
          queryKey: [...qk.buyout.infinite(scope, projectCode), 'full'],
          queryFn: () => dataService.getBuyoutEntries(projectCode),
        });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load buyout entries');
    }
  }, [queryClient, scope, dataService, infiniteEnabled]);

  const initializeLog = React.useCallback(async (projectCode: string) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      const data = await initializeLogMutation.mutateAsync(projectCode);
      broadcastBuyoutChange(projectCode, projectCode, 'created', 'Buyout log initialized');
      return data;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to initialize buyout log');
      throw err;
    }
  }, [initializeLogMutation, broadcastBuyoutChange]);

  const addEntry = React.useCallback(async (projectCode: string, entry: Partial<IBuyoutEntry>) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      const created = await addEntryMutation.mutateAsync({ projectCode, entry });
      broadcastBuyoutChange(projectCode, created.id, 'created', 'Buyout entry added');
      return created;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  }, [addEntryMutation, broadcastBuyoutChange]);

  const updateEntry = React.useCallback(async (projectCode: string, entryId: number, data: Partial<IBuyoutEntry>) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      const updated = await updateEntryMutation.mutateAsync({ projectCode, entryId, data });
      broadcastBuyoutChange(projectCode, entryId, 'updated', 'Buyout entry updated');
      return updated;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    }
  }, [updateEntryMutation, broadcastBuyoutChange]);

  const removeEntry = React.useCallback(async (projectCode: string, entryId: number) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      await removeEntryMutation.mutateAsync({ projectCode, entryId });
      broadcastBuyoutChange(projectCode, entryId, 'deleted', 'Buyout entry removed');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to remove entry');
      throw err;
    }
  }, [removeEntryMutation, broadcastBuyoutChange]);

  const entries = React.useMemo(() => {
    if (paged.mode === 'infinite') {
      return (paged.infiniteQuery.data?.pages ?? []).flatMap((page: { items: IBuyoutEntry[] }) => page.items);
    }
    return (paged.fullQuery.data as IBuyoutEntry[] | undefined) ?? [];
  }, [paged]);
  const queryError = paged.mode === 'infinite' ? paged.infiniteQuery.error : paged.fullQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);
  const loading =
    (paged.mode === 'infinite' ? paged.infiniteQuery.isFetching : paged.fullQuery.isFetching) ||
    initializeLogMutation.isPending ||
    addEntryMutation.isPending ||
    updateEntryMutation.isPending ||
    removeEntryMutation.isPending;

  const metrics: IBuyoutMetrics = React.useMemo(() => {
    const totalOriginalBudget = entries.reduce((sum: number, e: IBuyoutEntry) => sum + e.originalBudget, 0);
    const awarded = entries.filter((e: IBuyoutEntry) => e.contractValue != null && e.contractValue > 0);
    const totalAwardedValue = awarded.reduce((sum: number, e: IBuyoutEntry) => sum + (e.contractValue || 0), 0);
    const totalOverUnder = awarded.reduce((sum: number, e: IBuyoutEntry) => sum + (e.overUnder || 0), 0);
    const executedCount = entries.filter((e: IBuyoutEntry) => e.status === 'Executed' || e.status === 'Awarded').length;
    const procurementProgress = entries.length > 0
      ? Math.round((executedCount / entries.length) * 100)
      : 0;

    return {
      totalOriginalBudget,
      totalAwardedValue,
      totalOverUnder,
      procurementProgress,
      totalDivisions: entries.length,
      awardedDivisions: executedCount,
    };
  }, [entries]);

  return {
    entries,
    loading,
    error,
    metrics,
    fetchEntries,
    initializeLog,
    addEntry,
    updateEntry,
    removeEntry,
    hasMore: paged.mode === 'infinite' ? Boolean(paged.infiniteQuery.hasNextPage) : false,
    loadMore: paged.mode === 'infinite' ? () => paged.infiniteQuery.fetchNextPage() : undefined,
    isLoadingMore: paged.mode === 'infinite' ? paged.infiniteQuery.isFetchingNextPage : false,
    infiniteMode: paged.mode,
  };
}
