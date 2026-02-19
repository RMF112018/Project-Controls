import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IPermit, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { useInfiniteSharePointList } from '../../tanstack/query/useInfiniteSharePointList';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export interface IPermitMetrics {
  total: number;
  active: number;
  pending: number;
  expired: number;
  void: number;
  expiringSoon: number;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
}

export function usePermitsLog() {
  const { dataService, currentUser, isFeatureEnabled } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);

  const infiniteEnabled =
    isFeatureEnabled('InfinitePagingEnabled') &&
    isFeatureEnabled('InfinitePaging_OpsLogs') &&
    typeof dataService.getPermitsPage === 'function';
  const paged = useInfiniteSharePointList<IPermit>({
    infiniteEnabled,
    enabled: Boolean(activeProjectCode),
    queryKey: qk.permits.infinite(scope, activeProjectCode ?? ''),
    fetchPage: ({ token, pageSize }) => dataService.getPermitsPage({ pageSize, token, projectCode: activeProjectCode ?? '' }),
    fetchAll: () => dataService.getPermits(activeProjectCode ?? ''),
    pageSize: 100,
  });

  useSignalRQueryInvalidation({
    entityType: EntityType.Permit,
    queryKeys: activeProjectCode ? [qk.permits.base(scope, activeProjectCode)] : [],
    onInvalidated: () => {
      if (activeProjectCode) {
        void queryClient.invalidateQueries({ queryKey: qk.permits.infinite(scope, activeProjectCode) });
      }
    },
  });

  const broadcastPermitChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Permit,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: activeProjectCode || undefined,
    });
  }, [broadcastChange, currentUser, activeProjectCode]);

  const fetchPermits = React.useCallback(async (projectCode: string) => {
    setActiveProjectCode(projectCode);
    setError(null);
    try {
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.permits.infinite(scope, projectCode) });
        await queryClient.refetchQueries({ queryKey: qk.permits.infinite(scope, projectCode), type: 'active' });
      } else {
        await queryClient.fetchQuery({
          queryKey: [...qk.permits.infinite(scope, projectCode), 'full'],
          queryFn: () => dataService.getPermits(projectCode),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permits');
    }
  }, [queryClient, scope, dataService, infiniteEnabled]);

  const addPermit = React.useCallback(async (projectCode: string, permit: Partial<IPermit>) => {
    setError(null);
    try {
      const created = await dataService.addPermit(projectCode, permit);
      await queryClient.invalidateQueries({ queryKey: qk.permits.infinite(scope, projectCode) });
      broadcastPermitChange(created.id, 'created', 'Permit added');
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add permit');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastPermitChange]);

  const updatePermit = React.useCallback(async (projectCode: string, permitId: number, data: Partial<IPermit>) => {
    setError(null);
    try {
      const updated = await dataService.updatePermit(projectCode, permitId, data);
      await queryClient.invalidateQueries({ queryKey: qk.permits.infinite(scope, projectCode) });
      broadcastPermitChange(permitId, 'updated', 'Permit updated');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permit');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastPermitChange]);

  const removePermit = React.useCallback(async (projectCode: string, permitId: number) => {
    setError(null);
    try {
      await dataService.removePermit(projectCode, permitId);
      await queryClient.invalidateQueries({ queryKey: qk.permits.infinite(scope, projectCode) });
      broadcastPermitChange(permitId, 'deleted', 'Permit removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove permit');
      throw err;
    }
  }, [dataService, queryClient, scope, broadcastPermitChange]);

  const permits = React.useMemo<IPermit[]>(() => {
    if (paged.mode === 'infinite') {
      return (paged.infiniteQuery.data?.pages ?? []).flatMap((page: { items: IPermit[] }) => page.items);
    }
    return (paged.fullQuery.data as IPermit[] | undefined) ?? [];
  }, [paged]);

  const queryError = paged.mode === 'infinite' ? paged.infiniteQuery.error : paged.fullQuery.error;
  const loading = paged.mode === 'infinite' ? paged.infiniteQuery.isFetching : paged.fullQuery.isFetching;
  const resolvedError = error ?? (queryError instanceof Error ? queryError.message : null);

  const metrics: IPermitMetrics = React.useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const active = permits.filter(p => p.status === 'Active');
    const pending = permits.filter(p => p.status === 'Pending Application' || p.status === 'Pending Revision');
    const expired = permits.filter(p => p.status === 'Expired');
    const voidPermits = permits.filter(p => p.status === 'VOID');
    const expiringSoon = permits.filter(p =>
      p.status === 'Active' && p.dateExpires && p.dateExpires >= todayStr && p.dateExpires <= thirtyDaysStr
    );

    const byType: Record<string, number> = {};
    for (const p of permits) {
      byType[p.type] = (byType[p.type] || 0) + 1;
    }

    const byLocation: Record<string, number> = {};
    for (const p of permits) {
      const loc = p.location || 'Unknown';
      byLocation[loc] = (byLocation[loc] || 0) + 1;
    }

    return {
      total: permits.length,
      active: active.length,
      pending: pending.length,
      expired: expired.length,
      void: voidPermits.length,
      expiringSoon: expiringSoon.length,
      byType,
      byLocation,
    };
  }, [permits]);

  return {
    permits,
    loading,
    error: resolvedError,
    metrics,
    fetchPermits,
    addPermit,
    updatePermit,
    removePermit,
    hasMore: paged.mode === 'infinite' ? Boolean(paged.infiniteQuery.hasNextPage) : false,
    loadMore: paged.mode === 'infinite' ? () => paged.infiniteQuery.fetchNextPage() : undefined,
    isLoadingMore: paged.mode === 'infinite' ? paged.infiniteQuery.isFetchingNextPage : false,
    infiniteMode: paged.mode,
  };
}
