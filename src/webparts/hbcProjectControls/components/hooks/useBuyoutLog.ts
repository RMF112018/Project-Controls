import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IBuyoutEntry, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { buyoutEntriesOptions } from '../../tanstack/query/queryOptions/buyout';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export interface IBuyoutMetrics {
  totalOriginalBudget: number;
  totalAwardedValue: number;
  totalOverUnder: number;
  procurementProgress: number;
  totalDivisions: number;
  awardedDivisions: number;
}

interface IOptimisticContext {
  key: ReadonlyArray<unknown>;
  previous: IBuyoutEntry[] | undefined;
  optimisticId?: number;
}

export function useBuyoutLog() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const entriesQuery = useQuery({
    ...buyoutEntriesOptions(scope, dataService, activeProjectCode ?? ''),
    enabled: !!activeProjectCode,
  });

  useSignalRQueryInvalidation({
    entityType: EntityType.RiskCost,
    queryKeys: [qk.buyout.base(scope)],
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
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (vars: { projectCode: string; entry: Partial<IBuyoutEntry> }): Promise<IBuyoutEntry> =>
      dataService.addBuyoutEntry(vars.projectCode, vars.entry),
    onMutate: async (vars): Promise<IOptimisticContext> => {
      const key = qk.buyout.entries(scope, vars.projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IBuyoutEntry[]>(key);
      const now = new Date().toISOString();
      const optimisticId = -Date.now();
      const optimisticEntry: IBuyoutEntry = {
        id: optimisticId,
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
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) => {
        const next = [...(prev ?? []), optimisticEntry];
        return next.sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
      });
      return { key, previous, optimisticId };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (created, vars, ctx) => {
      const key = qk.buyout.entries(scope, vars.projectCode);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) => {
        const withoutOptimistic = (prev ?? []).filter((entry) => entry.id !== ctx?.optimisticId);
        const next = [...withoutOptimistic, created];
        return next.sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async (vars: { projectCode: string; entryId: number; data: Partial<IBuyoutEntry> }): Promise<IBuyoutEntry> =>
      dataService.updateBuyoutEntry(vars.projectCode, vars.entryId, vars.data),
    onMutate: async (vars): Promise<IOptimisticContext> => {
      const key = qk.buyout.entries(scope, vars.projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IBuyoutEntry[]>(key);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) =>
        (prev ?? []).map((entry) => entry.id === vars.entryId ? { ...entry, ...vars.data } : entry)
      );
      return { key, previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSuccess: (updated, vars) => {
      const key = qk.buyout.entries(scope, vars.projectCode);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) =>
        (prev ?? []).map((entry) => entry.id === vars.entryId ? updated : entry)
      );
    },
  });

  const removeEntryMutation = useMutation({
    mutationFn: async (vars: { projectCode: string; entryId: number }): Promise<void> =>
      dataService.removeBuyoutEntry(vars.projectCode, vars.entryId),
    onMutate: async (vars): Promise<IOptimisticContext> => {
      const key = qk.buyout.entries(scope, vars.projectCode);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<IBuyoutEntry[]>(key);
      queryClient.setQueryData<IBuyoutEntry[]>(key, (prev) => (prev ?? []).filter((entry) => entry.id !== vars.entryId));
      return { key, previous };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
  });

  const fetchEntries = React.useCallback(async (projectCode: string) => {
    setLocalError(null);
    setActiveProjectCode(projectCode);
    try {
      await queryClient.fetchQuery(buyoutEntriesOptions(scope, dataService, projectCode));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load buyout entries');
    }
  }, [queryClient, scope, dataService]);

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

  const entries = React.useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const queryError = entriesQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);
  const loading =
    entriesQuery.isFetching ||
    initializeLogMutation.isPending ||
    addEntryMutation.isPending ||
    updateEntryMutation.isPending ||
    removeEntryMutation.isPending;

  const metrics: IBuyoutMetrics = React.useMemo(() => {
    const totalOriginalBudget = entries.reduce((sum, e) => sum + e.originalBudget, 0);
    const awarded = entries.filter(e => e.contractValue != null && e.contractValue > 0);
    const totalAwardedValue = awarded.reduce((sum, e) => sum + (e.contractValue || 0), 0);
    const totalOverUnder = awarded.reduce((sum, e) => sum + (e.overUnder || 0), 0);
    const executedCount = entries.filter(e => e.status === 'Executed' || e.status === 'Awarded').length;
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
  };
}
