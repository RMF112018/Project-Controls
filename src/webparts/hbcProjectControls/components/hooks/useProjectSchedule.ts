import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IProjectScheduleCriticalPath, ICriticalPathItem, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { projectScheduleOptions } from '../../tanstack/query/queryOptions/schedule';
import { qk } from '../../tanstack/query/queryKeys';

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
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const scheduleQuery = useQuery(projectScheduleOptions(scope, dataService, projectCode));

  const schedule = scheduleQuery.data ?? null;
  const isLoading = scheduleQuery.isLoading;
  const error = scheduleQuery.error?.message ?? null;

  // SignalR: invalidate schedule queries on entity changes
  useSignalRQueryInvalidation({
    entityType: EntityType.Schedule,
    queryKeys: React.useMemo(() => projectCode ? [qk.schedule.byProject(scope, projectCode)] : [], [scope, projectCode]),
    projectCode,
  });

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
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const fetchSchedule = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const updateSchedule = React.useCallback(async (code: string, data: Partial<IProjectScheduleCriticalPath>) => {
    await dataService.updateProjectSchedule(code, data);
    broadcastScheduleChange('schedule', 'updated', 'Schedule updated');
    dataService.syncToDataMart(code).catch(() => { /* silent */ });
    await queryClient.invalidateQueries({ queryKey: qk.schedule.byProject(scope, code) });
  }, [dataService, broadcastScheduleChange, queryClient, scope]);

  const addCriticalPathItem = React.useCallback(async (code: string, item: Partial<ICriticalPathItem>) => {
    const created = await dataService.addCriticalPathItem(code, item);
    broadcastScheduleChange(created.id, 'created', 'Critical path item added');
    dataService.syncToDataMart(code).catch(() => { /* silent */ });
    await queryClient.invalidateQueries({ queryKey: qk.schedule.byProject(scope, code) });
    return created;
  }, [dataService, broadcastScheduleChange, queryClient, scope]);

  const daysToCompletion = React.useMemo(() => {
    if (!schedule?.substantialCompletionDate) return null;
    const today = new Date();
    const completion = new Date(schedule.substantialCompletionDate);
    return Math.ceil((completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [schedule]);

  return { schedule, isLoading, error, fetchSchedule, updateSchedule, addCriticalPathItem, daysToCompletion };
}
