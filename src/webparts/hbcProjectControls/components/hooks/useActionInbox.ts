import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from './useSignalR';
import { IActionInboxItem, ActionPriority, EntityType } from '@hbc/sp-services';

const POLL_INTERVAL_DEFAULT = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_SIGNALR = 60 * 1000;     // 60 seconds backup when SignalR connected

interface IUseActionInboxResult {
  items: IActionInboxItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  urgentCount: number;
  refresh: () => Promise<void>;
}

export function useActionInbox(): IUseActionInboxResult {
  const { dataService, currentUser } = useAppContext();
  const [items, setItems] = React.useState<IActionInboxItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const result = await dataService.getActionItems(currentUser.email);
      setItems(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load action items');
    } finally {
      setLoading(false);
    }
  }, [dataService, currentUser?.email]);

  // SignalR: refresh on any workflow entity change (read-only hook)
  const { isEnabled: signalRConnected } = useSignalR({
    onEntityChanged: React.useCallback(() => { refresh(); }, [refresh]),
  });

  React.useEffect(() => { refresh(); }, [refresh]);

  // Polling: relax interval when SignalR is connected
  React.useEffect(() => {
    const interval = setInterval(refresh, signalRConnected ? POLL_INTERVAL_SIGNALR : POLL_INTERVAL_DEFAULT);
    return () => clearInterval(interval);
  }, [refresh, signalRConnected]);

  return {
    items,
    loading,
    error,
    totalCount: items.length,
    urgentCount: items.filter(i => i.priority === ActionPriority.Urgent).length,
    refresh,
  };
}
