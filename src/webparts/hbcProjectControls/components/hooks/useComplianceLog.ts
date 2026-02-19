import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import {
  IComplianceEntry,
  IComplianceSummary,
  IComplianceLogFilter,
  EVerifyStatus,
  CommitmentStatus,
  EntityType,
} from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import { complianceLogOptions, complianceSummaryOptions } from '../../tanstack/query/queryOptions/compliance';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { stableFilterHash } from '../../tanstack/query/queryOptions/stableFilterHash';
import { useInfiniteSharePointList } from '../../tanstack/query/useInfiniteSharePointList';

export function useComplianceLog() {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<IComplianceLogFilter>({});
  const [localError, setLocalError] = React.useState<string | null>(null);

  const infiniteEnabled =
    isFeatureEnabled('InfinitePagingEnabled') &&
    isFeatureEnabled('InfinitePaging_AuditCompliance') &&
    typeof dataService.getComplianceLogPage === 'function';
  const filtersHash = stableFilterHash(filters);

  const infinite = useInfiniteSharePointList<IComplianceEntry>({
    infiniteEnabled,
    queryKey: qk.compliance.infinite(scope, filtersHash),
    fetchPage: ({ token, pageSize }) => dataService.getComplianceLogPage({ pageSize, token, filters: filters as unknown as Record<string, unknown> }),
    fetchAll: () => dataService.getComplianceLog(filters),
    pageSize: 100,
    staleTime: 30_000,
  });

  const summaryQuery = useQuery(complianceSummaryOptions(scope, dataService));

  // Invalidate base key only; infinite query rebuilds pages from the root.
  useSignalRQueryInvalidation({
    entityType: EntityType.Quality,
    queryKeys: [qk.compliance.base(scope)],
    onInvalidated: () => {
      void queryClient.invalidateQueries({ queryKey: qk.compliance.infinite(scope, filtersHash) });
    },
  });

  const fetchEntries = React.useCallback(async (filterOverrides?: IComplianceLogFilter) => {
    setLocalError(null);
    const activeFilters = filterOverrides ?? filters;
    const hash = stableFilterHash(activeFilters);

    try {
      if (infiniteEnabled) {
        await queryClient.invalidateQueries({ queryKey: qk.compliance.infinite(scope, hash) });
        await queryClient.refetchQueries({ queryKey: qk.compliance.infinite(scope, hash), type: 'active' });
      } else {
        await queryClient.fetchQuery(complianceLogOptions(scope, dataService, activeFilters));
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load compliance log');
    }
  }, [queryClient, scope, dataService, filters, infiniteEnabled]);

  const fetchSummary = React.useCallback(async () => {
    setLocalError(null);
    try {
      await queryClient.fetchQuery(complianceSummaryOptions(scope, dataService));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load compliance summary');
    }
  }, [queryClient, scope, dataService]);

  const updateFilters = React.useCallback((newFilters: Partial<IComplianceLogFilter>) => {
    const merged = { ...filters, ...newFilters } as IComplianceLogFilter;
    setFilters(merged);
    fetchEntries(merged).catch(console.error);
  }, [filters, fetchEntries]);

  const clearFilters = React.useCallback(() => {
    setFilters({});
    fetchEntries({}).catch(console.error);
  }, [fetchEntries]);

  const entries = React.useMemo<IComplianceEntry[]>(() => {
    if (infinite.mode === 'infinite') {
      const pages = infinite.infiniteQuery.data?.pages ?? [];
      return pages.flatMap((page: { items: IComplianceEntry[] }) => page.items);
    }
    return (infinite.fullQuery.data as IComplianceEntry[] | undefined) ?? [];
  }, [infinite]);

  const summary = React.useMemo<IComplianceSummary | null>(() => summaryQuery.data ?? null, [summaryQuery.data]);

  const queryError = infinite.mode === 'infinite'
    ? infinite.infiniteQuery.error
    : infinite.fullQuery.error;

  const loading = infinite.mode === 'infinite'
    ? infinite.infiniteQuery.isFetching || summaryQuery.isFetching
    : infinite.fullQuery.isFetching || summaryQuery.isFetching;

  const error = localError ?? (queryError instanceof Error ? queryError.message : null) ??
    (summaryQuery.error instanceof Error ? summaryQuery.error.message : null);

  // Computed values
  const uniqueProjects = React.useMemo(() => {
    const codes = [...new Set(entries.map(e => e.projectCode))];
    return codes.sort();
  }, [entries]);

  const uniqueEVerifyStatuses = React.useMemo((): EVerifyStatus[] => {
    return ['Not Sent', 'Sent', 'Reminder Sent', 'Received', 'Overdue'];
  }, []);

  const uniqueCommitmentStatuses = React.useMemo((): CommitmentStatus[] => {
    const statuses = [...new Set(entries.map(e => e.commitmentStatus))];
    return statuses.sort() as CommitmentStatus[];
  }, [entries]);

  return {
    entries,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    fetchEntries,
    fetchSummary,
    uniqueProjects,
    uniqueEVerifyStatuses,
    uniqueCommitmentStatuses,
    hasMore: infinite.mode === 'infinite' ? Boolean(infinite.infiniteQuery.hasNextPage) : false,
    loadMore: infinite.mode === 'infinite' ? () => infinite.infiniteQuery.fetchNextPage() : undefined,
    isLoadingMore: infinite.mode === 'infinite' ? infinite.infiniteQuery.isFetchingNextPage : false,
    infiniteMode: infinite.mode,
  };
}
