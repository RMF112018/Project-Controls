import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IConstraintLog, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { useInfiniteSharePointList } from '../../tanstack/query/useInfiniteSharePointList';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export interface IConstraintMetrics {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  totalBIC: number;
  byCategory: Record<string, number>;
  byCategoryAndStatus: Record<string, { open: number; closed: number }>;
}

export function useConstraintLog() {
  const { dataService, currentUser, isFeatureEnabled } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);

  const infiniteEnabled =
    isFeatureEnabled('InfinitePagingEnabled') &&
    isFeatureEnabled('InfinitePaging_OpsLogs') &&
    typeof dataService.getConstraintsPage === 'function';
  const paged = useInfiniteSharePointList<IConstraintLog>({
    infiniteEnabled,
    enabled: Boolean(activeProjectCode),
    queryKey: qk.constraints.infinite(scope, activeProjectCode ?? ''),
    fetchPage: ({ token, pageSize }) => dataService.getConstraintsPage({ pageSize, token, projectCode: activeProjectCode ?? '' }),
    fetchAll: () => dataService.getConstraints(activeProjectCode ?? ''),
    pageSize: 100,
  });

  useSignalRQueryInvalidation({
    entityType: EntityType.Constraint,
    queryKeys: activeProjectCode ? [qk.constraints.base(scope, activeProjectCode)] : [],
    onInvalidated: () => {
      if (activeProjectCode) {
        void queryClient.invalidateQueries({ queryKey: qk.constraints.infinite(scope, activeProjectCode) });
      }
    },
  });

  const broadcastConstraintChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Constraint,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: activeProjectCode || undefined,
    });
  }, [broadcastChange, currentUser, activeProjectCode]);

  const fetchConstraints = React.useCallback(async (projectCode: string) => {
    setActiveProjectCode(projectCode);
    setError(null);
    try {
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.constraints.infinite(scope, projectCode) });
        await queryClient.refetchQueries({ queryKey: qk.constraints.infinite(scope, projectCode), type: 'active' });
      } else {
        await queryClient.fetchQuery({
          queryKey: [...qk.constraints.infinite(scope, projectCode), 'full'],
          queryFn: () => dataService.getConstraints(projectCode),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load constraints');
    }
  }, [queryClient, scope, dataService, infiniteEnabled]);

  const addConstraint = React.useCallback(async (projectCode: string, constraint: Partial<IConstraintLog>) => {
    setError(null);
    try {
      const created = await dataService.addConstraint(projectCode, constraint);
      await queryClient.invalidateQueries({ queryKey: qk.constraints.infinite(scope, projectCode) });
      broadcastConstraintChange(created.id, 'created', 'Constraint added');
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add constraint');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastConstraintChange]);

  const updateConstraint = React.useCallback(async (projectCode: string, constraintId: number, data: Partial<IConstraintLog>) => {
    setError(null);
    try {
      const updated = await dataService.updateConstraint(projectCode, constraintId, data);
      await queryClient.invalidateQueries({ queryKey: qk.constraints.infinite(scope, projectCode) });
      broadcastConstraintChange(constraintId, 'updated', 'Constraint updated');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update constraint');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastConstraintChange]);

  const removeConstraint = React.useCallback(async (projectCode: string, constraintId: number) => {
    setError(null);
    try {
      await dataService.removeConstraint(projectCode, constraintId);
      await queryClient.invalidateQueries({ queryKey: qk.constraints.infinite(scope, projectCode) });
      broadcastConstraintChange(constraintId, 'deleted', 'Constraint removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove constraint');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastConstraintChange]);

  const entries = React.useMemo<IConstraintLog[]>(() => {
    if (paged.mode === 'infinite') {
      return (paged.infiniteQuery.data?.pages ?? []).flatMap((page: { items: IConstraintLog[] }) => page.items);
    }
    return (paged.fullQuery.data as IConstraintLog[] | undefined) ?? [];
  }, [paged]);

  const loading = paged.mode === 'infinite' ? paged.infiniteQuery.isFetching : paged.fullQuery.isFetching;
  const queryError = paged.mode === 'infinite' ? paged.infiniteQuery.error : paged.fullQuery.error;
  const resolvedError = error ?? (queryError instanceof Error ? queryError.message : null);

  const metrics: IConstraintMetrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const open = entries.filter(e => e.status === 'Open');
    const closed = entries.filter(e => e.status === 'Closed');
    const overdue = open.filter(e => e.dueDate && e.dueDate < today);
    const totalBIC = entries.reduce((sum, e) => sum + (e.budgetImpactCost || 0), 0);

    const byCategory: Record<string, number> = {};
    const byCategoryAndStatus: Record<string, { open: number; closed: number }> = {};
    for (const e of entries) {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      if (!byCategoryAndStatus[e.category]) byCategoryAndStatus[e.category] = { open: 0, closed: 0 };
      if (e.status === 'Open') byCategoryAndStatus[e.category].open++;
      else byCategoryAndStatus[e.category].closed++;
    }

    return {
      total: entries.length,
      open: open.length,
      closed: closed.length,
      overdue: overdue.length,
      totalBIC,
      byCategory,
      byCategoryAndStatus,
    };
  }, [entries]);

  return {
    entries,
    loading,
    error: resolvedError,
    metrics,
    fetchConstraints,
    addConstraint,
    updateConstraint,
    removeConstraint,
    hasMore: paged.mode === 'infinite' ? Boolean(paged.infiniteQuery.hasNextPage) : false,
    loadMore: paged.mode === 'infinite' ? () => paged.infiniteQuery.fetchNextPage() : undefined,
    isLoadingMore: paged.mode === 'infinite' ? paged.infiniteQuery.isFetchingNextPage : false,
    infiniteMode: paged.mode,
  };
}
