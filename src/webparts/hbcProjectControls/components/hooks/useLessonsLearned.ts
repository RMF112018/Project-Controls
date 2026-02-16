import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ILessonLearned, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseLessonsLearnedResult {
  lessons: ILessonLearned[];
  isLoading: boolean;
  error: string | null;
  fetchLessons: (projectCode: string) => Promise<void>;
  addLesson: (projectCode: string, lesson: Partial<ILessonLearned>) => Promise<ILessonLearned>;
  updateLesson: (projectCode: string, lessonId: number, data: Partial<ILessonLearned>) => Promise<ILessonLearned>;
  byCategory: Record<string, ILessonLearned[]>;
  byImpact: Record<string, ILessonLearned[]>;
}

export function useLessonsLearned(): IUseLessonsLearnedResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [lessons, setLessons] = React.useState<ILessonLearned[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchLessons = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getLessonsLearned(projectCode);
      setLessons(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons learned');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on LessonLearned entity changes from other users
  useSignalR({
    entityType: EntityType.LessonLearned,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchLessons(lastProjectCodeRef.current);
      }
    }, [fetchLessons]),
  });

  // Helper to broadcast lesson learned changes
  const broadcastLessonChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.LessonLearned,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const addLesson = React.useCallback(async (projectCode: string, lesson: Partial<ILessonLearned>) => {
    const created = await dataService.addLessonLearned(projectCode, lesson);
    setLessons(prev => [...prev, created]);
    broadcastLessonChange(created.id, 'created', 'Lesson learned added');
    return created;
  }, [dataService, broadcastLessonChange]);

  const updateLesson = React.useCallback(async (projectCode: string, lessonId: number, data: Partial<ILessonLearned>) => {
    const updated = await dataService.updateLessonLearned(projectCode, lessonId, data);
    setLessons(prev => prev.map(l => l.id === lessonId ? updated : l));
    broadcastLessonChange(lessonId, 'updated', 'Lesson learned updated');
    return updated;
  }, [dataService, broadcastLessonChange]);

  const byCategory = React.useMemo(() => {
    const grouped: Record<string, ILessonLearned[]> = {};
    lessons.forEach(l => {
      if (!grouped[l.category]) grouped[l.category] = [];
      grouped[l.category].push(l);
    });
    return grouped;
  }, [lessons]);

  const byImpact = React.useMemo(() => {
    const grouped: Record<string, ILessonLearned[]> = {};
    lessons.forEach(l => {
      if (!grouped[l.impact]) grouped[l.impact] = [];
      grouped[l.impact].push(l);
    });
    return grouped;
  }, [lessons]);

  return { lessons, isLoading, error, fetchLessons, addLesson, updateLesson, byCategory, byImpact };
}
