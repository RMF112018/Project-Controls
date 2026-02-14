import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IActionInboxItem, ActionPriority } from '@hbc/sp-services';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    items,
    loading,
    error,
    totalCount: items.length,
    urgentCount: items.filter(i => i.priority === ActionPriority.Urgent).length,
    refresh,
  };
}
