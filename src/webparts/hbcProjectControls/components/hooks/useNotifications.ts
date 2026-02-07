import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { INotification, NotificationEvent } from '../../models';
import { NotificationService, INotificationContext } from '../../services/NotificationService';

interface IUseNotificationsResult {
  notifications: INotification[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (projectCode?: string) => Promise<void>;
  notify: (event: NotificationEvent, ctx: INotificationContext) => Promise<void>;
}

export function useNotifications(): IUseNotificationsResult {
  const { dataService, currentUser } = useAppContext();
  const [notifications, setNotifications] = React.useState<INotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const notificationService = React.useMemo(
    () => new NotificationService(dataService),
    [dataService]
  );

  const fetchNotifications = React.useCallback(async (projectCode?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getNotifications(projectCode);
      setNotifications(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const notify = React.useCallback(async (event: NotificationEvent, ctx: INotificationContext) => {
    const sentBy = currentUser?.email ?? 'system@hedrickbrothers.com';
    const result = await notificationService.notify(event, ctx, sentBy);
    if (result) {
      setNotifications(prev => [result, ...prev]);
    }
  }, [notificationService, currentUser]);

  return { notifications, isLoading, error, fetchNotifications, notify };
}
