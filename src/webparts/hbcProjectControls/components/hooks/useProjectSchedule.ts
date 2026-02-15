import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IProjectScheduleCriticalPath, ICriticalPathItem, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseProjectScheduleResult {
  schedule: IProjectScheduleCriticalPath | null;
  isLoading: boolean;
  error: string | null;
  fetchSchedule: (projectCode: string) => Promise<void>;
  updateSchedule: (projectCode: string, data: Partial<IProjectScheduleCriticalPath>) => Promise<void>;
  addCriticalPathItem: (projectCode: string, item: Partial<ICriticalPathItem>) => Promise<ICriticalPathItem>;
  daysToCompletion: number | null;
}

export function useProjectSchedule(): IUseProjectScheduleResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [schedule, setSchedule] = React.useState<IProjectScheduleCriticalPath | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchSchedule = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getProjectSchedule(projectCode);
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Schedule entity changes from other users
  useSignalR({
    entityType: EntityType.Schedule,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchSchedule(lastProjectCodeRef.current);
      }
    }, [fetchSchedule]),
  });

  // Helper to broadcast schedule changes
  const broadcastScheduleChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Schedule,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateSchedule = React.useCallback(async (projectCode: string, data: Partial<IProjectScheduleCriticalPath>) => {
    const updated = await dataService.updateProjectSchedule(projectCode, data);
    setSchedule(updated);
    broadcastScheduleChange('schedule', 'updated', 'Schedule updated');
  }, [dataService, broadcastScheduleChange]);

  const addCriticalPathItem = React.useCallback(async (projectCode: string, item: Partial<ICriticalPathItem>) => {
    const created = await dataService.addCriticalPathItem(projectCode, item);
    const refreshed = await dataService.getProjectSchedule(projectCode);
    setSchedule(refreshed);
    broadcastScheduleChange(created.id, 'created', 'Critical path item added');
    return created;
  }, [dataService, broadcastScheduleChange]);

  const daysToCompletion = React.useMemo(() => {
    if (!schedule?.substantialCompletionDate) return null;
    const today = new Date();
    const completion = new Date(schedule.substantialCompletionDate);
    return Math.ceil((completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [schedule]);

  return { schedule, isLoading, error, fetchSchedule, updateSchedule, addCriticalPathItem, daysToCompletion };
}
