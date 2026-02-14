import * as React from 'react';
import { IPerformanceLog, IPerformanceSummary, IPerformanceQueryOptions } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';

interface IUsePerformanceMetricsResult {
  logs: IPerformanceLog[];
  summary: IPerformanceSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  dateRange: { startDate?: string; endDate?: string };
  setDateRange: (range: { startDate?: string; endDate?: string }) => void;
}

export function usePerformanceMetrics(): IUsePerformanceMetricsResult {
  const { dataService } = useAppContext();
  const [logs, setLogs] = React.useState<IPerformanceLog[]>([]);
  const [summary, setSummary] = React.useState<IPerformanceSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<{ startDate?: string; endDate?: string }>({});

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const options: IPerformanceQueryOptions = {
        ...dateRange,
        limit: 200,
      };
      const [fetchedLogs, fetchedSummary] = await Promise.all([
        dataService.getPerformanceLogs(options),
        dataService.getPerformanceSummary(options),
      ]);
      setLogs(fetchedLogs);
      setSummary(fetchedSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [dataService, dateRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    logs,
    summary,
    loading,
    error,
    refresh: fetchData,
    dateRange,
    setDateRange,
  };
}
