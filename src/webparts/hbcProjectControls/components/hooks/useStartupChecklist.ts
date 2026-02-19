import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IStartupChecklistItem, IStartupChecklistSummary, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { useInfiniteSharePointList } from '../../tanstack/query/useInfiniteSharePointList';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

interface IUseStartupChecklistResult {
  items: IStartupChecklistItem[];
  isLoading: boolean;
  error: string | null;
  fetchChecklist: (projectCode: string) => Promise<void>;
  updateItem: (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) => Promise<IStartupChecklistItem>;
  addItem: (projectCode: string, item: Partial<IStartupChecklistItem>) => Promise<IStartupChecklistItem>;
  removeItem: (projectCode: string, itemId: number) => Promise<void>;
  getSummary: () => IStartupChecklistSummary;
  getSectionSummary: (sectionNumber: number) => IStartupChecklistSummary;
  hasMore: boolean;
  loadMore?: () => Promise<unknown>;
  isLoadingMore: boolean;
  infiniteMode: 'full' | 'infinite';
}

export function useStartupChecklist(): IUseStartupChecklistResult {
  const { dataService, currentUser, isFeatureEnabled } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);

  const infiniteEnabled =
    isFeatureEnabled('InfinitePagingEnabled') &&
    isFeatureEnabled('InfinitePaging_StartupRisk') &&
    typeof dataService.getStartupChecklistPage === 'function';
  const paged = useInfiniteSharePointList<IStartupChecklistItem>({
    infiniteEnabled,
    enabled: Boolean(activeProjectCode),
    queryKey: qk.startupChecklist.infinite(scope, activeProjectCode ?? ''),
    fetchPage: ({ token, pageSize }) => dataService.getStartupChecklistPage({ pageSize, token, projectCode: activeProjectCode ?? '' }),
    fetchAll: () => dataService.getStartupChecklist(activeProjectCode ?? ''),
    pageSize: 100,
  });

  useSignalRQueryInvalidation({
    entityType: EntityType.Checklist,
    queryKeys: activeProjectCode ? [qk.startupChecklist.base(scope, activeProjectCode)] : [],
    onInvalidated: () => {
      if (activeProjectCode) {
        void queryClient.invalidateQueries({ queryKey: qk.startupChecklist.infinite(scope, activeProjectCode) });
      }
    },
  });

  const broadcastChecklistChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Checklist,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: activeProjectCode || undefined,
    });
  }, [broadcastChange, currentUser, activeProjectCode]);

  const fetchChecklist = React.useCallback(async (projectCode: string) => {
    setError(null);
    setActiveProjectCode(projectCode);
    try {
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.startupChecklist.infinite(scope, projectCode) });
        await queryClient.refetchQueries({ queryKey: qk.startupChecklist.infinite(scope, projectCode), type: 'active' });
      } else {
        await queryClient.fetchQuery({
          queryKey: [...qk.startupChecklist.infinite(scope, projectCode), 'full'],
          queryFn: () => dataService.getStartupChecklist(projectCode),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist');
    }
  }, [queryClient, scope, dataService, infiniteEnabled]);

  const updateItem = React.useCallback(async (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) => {
    const updated = await dataService.updateChecklistItem(projectCode, itemId, data);
    await queryClient.invalidateQueries({ queryKey: qk.startupChecklist.infinite(scope, projectCode) });
    broadcastChecklistChange(itemId, 'updated', 'Checklist item updated');
    return updated;
  }, [dataService, queryClient, scope, broadcastChecklistChange]);

  const addItem = React.useCallback(async (projectCode: string, item: Partial<IStartupChecklistItem>) => {
    const created = await dataService.addChecklistItem(projectCode, item);
    await queryClient.invalidateQueries({ queryKey: qk.startupChecklist.infinite(scope, projectCode) });
    broadcastChecklistChange(created.id, 'created', 'Checklist item added');
    return created;
  }, [dataService, queryClient, scope, broadcastChecklistChange]);

  const removeItem = React.useCallback(async (projectCode: string, itemId: number) => {
    await dataService.removeChecklistItem(projectCode, itemId);
    await queryClient.invalidateQueries({ queryKey: qk.startupChecklist.infinite(scope, projectCode) });
    broadcastChecklistChange(itemId, 'deleted', 'Checklist item removed');
  }, [dataService, queryClient, scope, broadcastChecklistChange]);

  const items = React.useMemo<IStartupChecklistItem[]>(() => {
    if (paged.mode === 'infinite') {
      return (paged.infiniteQuery.data?.pages ?? []).flatMap((page: { items: IStartupChecklistItem[] }) => page.items);
    }
    return (paged.fullQuery.data as IStartupChecklistItem[] | undefined) ?? [];
  }, [paged]);

  const computeSummary = React.useCallback((subset: IStartupChecklistItem[]): IStartupChecklistSummary => {
    return {
      total: subset.length,
      conforming: subset.filter(i => i.status === 'Conforming').length,
      deficient: subset.filter(i => i.status === 'Deficient').length,
      na: subset.filter(i => i.status === 'NA').length,
      neutral: subset.filter(i => i.status === 'Neutral').length,
      noResponse: subset.filter(i => i.status === 'NoResponse').length,
    };
  }, []);

  const getSummary = React.useCallback(() => computeSummary(items), [items, computeSummary]);

  const getSectionSummary = React.useCallback((sectionNumber: number) => {
    return computeSummary(items.filter(i => i.sectionNumber === sectionNumber));
  }, [items, computeSummary]);

  const queryError = paged.mode === 'infinite' ? paged.infiniteQuery.error : paged.fullQuery.error;

  return {
    items,
    isLoading: paged.mode === 'infinite' ? paged.infiniteQuery.isFetching : paged.fullQuery.isFetching,
    error: error ?? (queryError instanceof Error ? queryError.message : null),
    fetchChecklist,
    updateItem,
    addItem,
    removeItem,
    getSummary,
    getSectionSummary,
    hasMore: paged.mode === 'infinite' ? Boolean(paged.infiniteQuery.hasNextPage) : false,
    loadMore: paged.mode === 'infinite' ? () => paged.infiniteQuery.fetchNextPage() : undefined,
    isLoadingMore: paged.mode === 'infinite' ? paged.infiniteQuery.isFetchingNextPage : false,
    infiniteMode: paged.mode,
  };
}
