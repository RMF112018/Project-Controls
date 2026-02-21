import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { IActionInboxItem, ActionPriority } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { actionInboxOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

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
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const userEmail = currentUser?.email ?? '';

  const inboxQuery = useQuery({
    ...actionInboxOptions(scope, dataService, userEmail),
    // TanStack Query handles refetchInterval natively — replaces manual polling
    refetchInterval: 60 * 1000,
  });

  const items = inboxQuery.data ?? [];
  const loading = inboxQuery.isLoading;
  const error = inboxQuery.error?.message ?? null;

  // SignalR: invalidate inbox on any workflow entity change
  useSignalRQueryInvalidation({
    entityType: undefined as never, // listen to all entity types
    queryKeys: React.useMemo(() => userEmail ? [qk.actionInbox.items(scope, userEmail)] : [], [scope, userEmail]),
  });

  const refresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.actionInbox.items(scope, userEmail) });
  }, [queryClient, scope, userEmail]);

  return {
    items,
    loading,
    error,
    totalCount: items.length,
    urgentCount: items.filter(i => i.priority === ActionPriority.Urgent).length,
    refresh,
  };
}
