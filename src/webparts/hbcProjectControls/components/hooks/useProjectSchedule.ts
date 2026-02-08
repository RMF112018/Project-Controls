import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IProjectScheduleCriticalPath, ICriticalPathItem } from '../../models/IProjectScheduleCriticalPath';

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
  const { dataService } = useAppContext();
  const [schedule, setSchedule] = React.useState<IProjectScheduleCriticalPath | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSchedule = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getProjectSchedule(projectCode);
      setSchedule(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const updateSchedule = React.useCallback(async (projectCode: string, data: Partial<IProjectScheduleCriticalPath>) => {
    const updated = await dataService.updateProjectSchedule(projectCode, data);
    setSchedule(updated);
  }, [dataService]);

  const addCriticalPathItem = React.useCallback(async (projectCode: string, item: Partial<ICriticalPathItem>) => {
    const created = await dataService.addCriticalPathItem(projectCode, item);
    const refreshed = await dataService.getProjectSchedule(projectCode);
    setSchedule(refreshed);
    return created;
  }, [dataService]);

  const daysToCompletion = React.useMemo(() => {
    if (!schedule?.substantialCompletionDate) return null;
    const today = new Date();
    const completion = new Date(schedule.substantialCompletionDate);
    return Math.ceil((completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [schedule]);

  return { schedule, isLoading, error, fetchSchedule, updateSchedule, addCriticalPathItem, daysToCompletion };
}
