import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IComplianceEntry, IComplianceSummary, IComplianceLogFilter } from '../../models/IComplianceSummary';
import { EVerifyStatus } from '../../models/IBuyoutEntry';
import { CommitmentStatus } from '../../models/ICommitmentApproval';

export function useComplianceLog() {
  const { dataService } = useAppContext();
  const [entries, setEntries] = React.useState<IComplianceEntry[]>([]);
  const [summary, setSummary] = React.useState<IComplianceSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<IComplianceLogFilter>({});

  const fetchEntries = React.useCallback(async (filterOverrides?: IComplianceLogFilter) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = filterOverrides ?? filters;
      const data = await dataService.getComplianceLog(activeFilters);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance log');
    } finally {
      setLoading(false);
    }
  }, [dataService, filters]);

  const fetchSummary = React.useCallback(async () => {
    try {
      const data = await dataService.getComplianceSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load compliance summary:', err);
    }
  }, [dataService]);

  // Initial fetch
  React.useEffect(() => {
    fetchEntries().catch(console.error);
    fetchSummary().catch(console.error);
  }, [fetchEntries, fetchSummary]);

  const updateFilters = React.useCallback((newFilters: Partial<IComplianceLogFilter>) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    fetchEntries(merged).catch(console.error);
  }, [filters, fetchEntries]);

  const clearFilters = React.useCallback(() => {
    setFilters({});
    fetchEntries({}).catch(console.error);
  }, [fetchEntries]);

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
