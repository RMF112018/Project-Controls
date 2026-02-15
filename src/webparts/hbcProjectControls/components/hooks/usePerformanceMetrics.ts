import * as React from 'react';
import { IPerformanceLog, IPerformanceSummary, IPerformanceQueryOptions, EntityType } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from './useSignalR';

const POLL_INTERVAL_DEFAULT = 30000;   // 30 seconds
const POLL_INTERVAL_SIGNALR = 120000;  // 120 seconds backup when SignalR connected

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

  // SignalR: refresh on Performance entity changes
  const { isEnabled: signalRConnected } = useSignalR({
    entityType: EntityType.Performance,
    onEntityChanged: React.useCallback(() => { fetchData(); }, [fetchData]),
  });

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh — relax interval when SignalR connected
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, signalRConnected ? POLL_INTERVAL_SIGNALR : POLL_INTERVAL_DEFAULT);
    return () => clearInterval(interval);
  }, [fetchData, signalRConnected]);

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
