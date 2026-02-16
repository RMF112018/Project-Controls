import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from './useSignalR';
import { IProvisioningLog, ProvisioningStatus, EntityType } from '@hbc/sp-services';

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

const POLL_INTERVAL_DEFAULT = 10000;  // 10 seconds
const POLL_INTERVAL_SIGNALR = 30000;  // 30 seconds backup when SignalR connected

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

  // SignalR: refresh on Project entity changes
  const { isEnabled: signalRConnected } = useSignalR({
    entityType: EntityType.Project,
    onEntityChanged: useCallback(() => { refresh(); }, [refresh]),
  });

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

  // Auto-refresh when active logs exist — relax interval when SignalR connected
  useEffect(() => {
    if (hasActive) {
      const interval = signalRConnected ? POLL_INTERVAL_SIGNALR : POLL_INTERVAL_DEFAULT;
      timerRef.current = setInterval(() => {
        refresh().catch(console.error);
      }, interval);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasActive, refresh, signalRConnected]);

  return { logs, isLoading, summary, refresh };
}
