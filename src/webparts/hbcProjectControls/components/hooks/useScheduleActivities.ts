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
} from '@hbc/sp-services';

export function useScheduleActivities() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [activities, setActivities] = React.useState<IScheduleActivity[]>([]);
  const [imports, setImports] = React.useState<IScheduleImport[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchActivities = React.useCallback(async (projectCode: string) => {
    setIsLoading(true);
    setError(null);
    lastProjectCodeRef.current = projectCode;
    try {
      const data = await dataService.getScheduleActivities(projectCode);
      setActivities(data);
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
        fetchActivities(lastProjectCodeRef.current);
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

  const metrics: IScheduleMetrics = React.useMemo(() => {
    const completedCount = activities.filter(a => a.status === 'Completed').length;
    const inProgressCount = activities.filter(a => a.status === 'In Progress').length;
    const notStartedCount = activities.filter(a => a.status === 'Not Started').length;
    const criticalActivityCount = activities.filter(a => a.isCritical).length;
    const negativeFloatCount = activities.filter(a => a.remainingFloat !== null && a.remainingFloat < 0).length;

    const floatsWithValues = activities.filter(a => a.remainingFloat !== null).map(a => a.remainingFloat!);
    const averageFloat = floatsWithValues.length > 0
      ? floatsWithValues.reduce((s, f) => s + f, 0) / floatsWithValues.length
      : 0;

    const percentComplete = activities.length > 0
      ? Math.round((completedCount / activities.length) * 100)
      : 0;

    const totalDuration = activities.reduce((s, a) => s + a.originalDuration, 0);
    const earnedDuration = activities.reduce((s, a) => s + a.actualDuration, 0);
    const spiApproximation = totalDuration > 0 ? Math.round((earnedDuration / totalDuration) * 100) / 100 : null;

    return {
      totalActivities: activities.length,
      completedCount,
      inProgressCount,
      notStartedCount,
      percentComplete,
      criticalActivityCount,
      negativeFloatCount,
      averageFloat: Math.round(averageFloat * 10) / 10,
      spiApproximation,
      floatDistribution: {
        negative: negativeFloatCount,
        zero: activities.filter(a => a.remainingFloat === 0).length,
        low: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 0 && a.remainingFloat <= 10).length,
        medium: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 10 && a.remainingFloat <= 30).length,
        high: activities.filter(a => a.remainingFloat !== null && a.remainingFloat > 30).length,
      },
    };
  }, [activities]);

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
