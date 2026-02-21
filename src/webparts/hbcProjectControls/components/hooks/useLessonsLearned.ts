import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { ILessonLearned, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { lessonsLearnedOptions } from '../../tanstack/query/queryOptions/operationsSimple';
import { qk } from '../../tanstack/query/queryKeys';

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
  const queryClient = useQueryClient();
  const scope = useQueryScope();
  const [projectCode, setProjectCode] = React.useState<string>('');

  const lessonsQuery = useQuery(lessonsLearnedOptions(scope, dataService, projectCode));

  const lessons = lessonsQuery.data ?? [];
  const isLoading = lessonsQuery.isLoading;
  const error = lessonsQuery.error?.message ?? null;

  useSignalRQueryInvalidation({
    entityType: EntityType.LessonLearned,
    queryKeys: React.useMemo(() => projectCode ? [qk.lessonsLearned.byProject(scope, projectCode)] : [], [scope, projectCode]),
  });

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
      projectCode: projectCode || undefined,
    });
  }, [broadcastChange, currentUser, projectCode]);

  const invalidate = React.useCallback(async (code: string) => {
    await queryClient.invalidateQueries({ queryKey: qk.lessonsLearned.byProject(scope, code) });
  }, [queryClient, scope]);

  const fetchLessons = React.useCallback(async (code: string) => {
    setProjectCode(code);
  }, []);

  const addLesson = React.useCallback(async (code: string, lesson: Partial<ILessonLearned>) => {
    const created = await dataService.addLessonLearned(code, lesson);
    broadcastLessonChange(created.id, 'created', 'Lesson learned added');
    await invalidate(code);
    return created;
  }, [dataService, broadcastLessonChange, invalidate]);

  const updateLesson = React.useCallback(async (code: string, lessonId: number, data: Partial<ILessonLearned>) => {
    const updated = await dataService.updateLessonLearned(code, lessonId, data);
    broadcastLessonChange(lessonId, 'updated', 'Lesson learned updated');
    await invalidate(code);
    return updated;
  }, [dataService, broadcastLessonChange, invalidate]);

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
