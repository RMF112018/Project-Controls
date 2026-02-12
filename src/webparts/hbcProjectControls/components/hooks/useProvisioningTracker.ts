import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IProvisioningLog, ProvisioningStatus } from '../../models';

export interface IProvisioningTrackerSummary {
  inProgress: number;
  completed: number;
  failed: number;
  queued: number;
  total: number;
}

export interface IProvisioningTrackerData {
  logs: IProvisioningLog[];
  isLoading: boolean;
  summary: IProvisioningTrackerSummary;
  refresh: () => Promise<void>;
}

const AUTO_REFRESH_MS = 10000;

export function useProvisioningTracker(): IProvisioningTrackerData {
  const { dataService } = useAppContext();
  const [logs, setLogs] = useState<IProvisioningLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await dataService.getProvisioningLogs();
      setLogs(result);
    } catch {
      // Silently fail — dashboard widget is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const summary: IProvisioningTrackerSummary = {
    inProgress: logs.filter(l => l.status === ProvisioningStatus.InProgress).length,
    completed: logs.filter(l => l.status === ProvisioningStatus.Completed).length,
    failed: logs.filter(l => l.status === ProvisioningStatus.Failed || l.status === ProvisioningStatus.PartialFailure).length,
    queued: logs.filter(l => l.status === ProvisioningStatus.Queued).length,
    total: logs.length,
  };

  const hasActive = summary.inProgress > 0 || summary.queued > 0;

  // Initial load
  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  // Auto-refresh when active logs exist
  useEffect(() => {
    if (hasActive) {
      timerRef.current = setInterval(() => {
        refresh().catch(console.error);
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasActive, refresh]);

  return { logs, isLoading, summary, refresh };
}
