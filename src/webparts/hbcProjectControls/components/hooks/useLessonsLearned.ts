import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ILessonLearned } from '@hbc/sp-services';

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
  const { dataService } = useAppContext();
  const [lessons, setLessons] = React.useState<ILessonLearned[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchLessons = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getLessonsLearned(projectCode);
      setLessons(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons learned');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const addLesson = React.useCallback(async (projectCode: string, lesson: Partial<ILessonLearned>) => {
    const created = await dataService.addLessonLearned(projectCode, lesson);
    setLessons(prev => [...prev, created]);
    return created;
  }, [dataService]);

  const updateLesson = React.useCallback(async (projectCode: string, lessonId: number, data: Partial<ILessonLearned>) => {
    const updated = await dataService.updateLessonLearned(projectCode, lessonId, data);
    setLessons(prev => prev.map(l => l.id === lessonId ? updated : l));
    return updated;
  }, [dataService]);

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
