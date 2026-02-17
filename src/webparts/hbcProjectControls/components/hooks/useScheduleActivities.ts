import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import {
  IScheduleActivity,
  IScheduleImport,
  IScheduleMetrics,
  EntityType,
  IEntityChangedMessage,
  computeScheduleMetrics,
} from '@hbc/sp-services';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'hbc-schedule-cache-';

function readActivityCache(projectCode: string): IScheduleActivity[] | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${projectCode}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { data: IScheduleActivity[]; timestamp: number };
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${projectCode}`);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function writeActivityCache(projectCode: string, data: IScheduleActivity[]): void {
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${projectCode}`,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch { /* quota exceeded — ignore */ }
}

export function useScheduleActivities() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [activities, setActivities] = React.useState<IScheduleActivity[]>([]);
  const [imports, setImports] = React.useState<IScheduleImport[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchActivities = React.useCallback(async (projectCode: string, bypassCache = false) => {
    lastProjectCodeRef.current = projectCode;

    // Try cache first (unless bypassed by SignalR)
    if (!bypassCache) {
      const cached = readActivityCache(projectCode);
      if (cached) {
        setActivities(cached);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getScheduleActivities(projectCode);
      setActivities(data);
      writeActivityCache(projectCode, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule activities');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchImports = React.useCallback(async (projectCode: string) => {
    try {
      const data = await dataService.getScheduleImports(projectCode);
      setImports(data);
    } catch {
      // non-critical
    }
  }, [dataService]);

  // SignalR: refresh on ScheduleActivity entity changes
  useSignalR({
    entityType: EntityType.ScheduleActivity,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchActivities(lastProjectCodeRef.current, true);
      }
    }, [fetchActivities]),
  });

  const broadcastScheduleChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.ScheduleActivity,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const importActivities = React.useCallback(async (
    projectCode: string,
    parsedActivities: IScheduleActivity[],
    importMeta: Partial<IScheduleImport>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const imported = await dataService.importScheduleActivities(projectCode, parsedActivities, importMeta);
      setActivities(imported);
      writeActivityCache(projectCode, imported);
      broadcastScheduleChange(projectCode, 'created', `Imported ${parsedActivities.length} activities`);
      // Refresh import history
      fetchImports(projectCode);
      // Fire-and-forget data mart sync
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return imported;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import activities');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dataService, broadcastScheduleChange, fetchImports]);

  const updateActivity = React.useCallback(async (
    projectCode: string,
    activityId: number,
    data: Partial<IScheduleActivity>
  ) => {
    setError(null);
    try {
      const updated = await dataService.updateScheduleActivity(projectCode, activityId, data);
      setActivities(prev => prev.map(a => a.id === activityId ? updated : a));
      broadcastScheduleChange(activityId, 'updated', 'Activity updated');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
      throw err;
    }
  }, [dataService, broadcastScheduleChange]);

  const deleteActivity = React.useCallback(async (
    projectCode: string,
    activityId: number
  ) => {
    setError(null);
    try {
      await dataService.deleteScheduleActivity(projectCode, activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      broadcastScheduleChange(activityId, 'deleted', 'Activity deleted');
      dataService.syncToDataMart(projectCode).catch(() => { /* silent */ });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
      throw err;
    }
  }, [dataService, broadcastScheduleChange]);

  const metrics: IScheduleMetrics = React.useMemo(
    () => computeScheduleMetrics(activities),
    [activities],
  );

  return {
    activities,
    imports,
    isLoading,
    error,
    metrics,
    fetchActivities,
    fetchImports,
    importActivities,
    updateActivity,
    deleteActivity,
  };
}
