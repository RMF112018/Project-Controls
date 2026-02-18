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

export function useComplianceLog() {
  const { dataService } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<IComplianceLogFilter>({});
  const [localError, setLocalError] = React.useState<string | null>(null);

  const fetchEntries = React.useCallback(async (filterOverrides?: IComplianceLogFilter) => {
    setLocalError(null);
    try {
      const activeFilters = filterOverrides ?? filters;
      await queryClient.fetchQuery(complianceLogOptions(scope, dataService, activeFilters));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load compliance log');
    }
  }, [queryClient, scope, dataService, filters]);

  const fetchSummary = React.useCallback(async () => {
    setLocalError(null);
    try {
      await queryClient.fetchQuery(complianceSummaryOptions(scope, dataService));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load compliance summary');
    }
  }, [queryClient, scope, dataService]);

  const entriesQuery = useQuery(complianceLogOptions(scope, dataService, filters));
  const summaryQuery = useQuery(complianceSummaryOptions(scope, dataService));

  useSignalRQueryInvalidation({
    entityType: EntityType.Quality,
    queryKeys: [qk.compliance.base(scope)],
  });

  const updateFilters = React.useCallback((newFilters: Partial<IComplianceLogFilter>) => {
    const merged = { ...filters, ...newFilters } as IComplianceLogFilter;
    setFilters(merged);
    fetchEntries(merged).catch(console.error);
  }, [filters, fetchEntries]);

  const clearFilters = React.useCallback(() => {
    setFilters({});
    fetchEntries({}).catch(console.error);
  }, [fetchEntries]);

  const entries = React.useMemo<IComplianceEntry[]>(() => entriesQuery.data ?? [], [entriesQuery.data]);
  const summary = React.useMemo<IComplianceSummary | null>(() => summaryQuery.data ?? null, [summaryQuery.data]);
  const queryError = entriesQuery.error ?? summaryQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);
  const loading = entriesQuery.isFetching || summaryQuery.isFetching;

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
  };
}
