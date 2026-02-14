import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IQualityConcern } from '@hbc/sp-services';

interface IUseQualityConcernsResult {
  concerns: IQualityConcern[];
  isLoading: boolean;
  error: string | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  openCount: number;
  resolvedCount: number;
}

export function useQualityConcerns(): IUseQualityConcernsResult {
  const { dataService } = useAppContext();
  const [concerns, setConcerns] = React.useState<IQualityConcern[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchConcerns = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getQualityConcerns(projectCode);
      setConcerns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality concerns');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const addConcern = React.useCallback(async (projectCode: string, concern: Partial<IQualityConcern>) => {
    const created = await dataService.addQualityConcern(projectCode, concern);
    setConcerns(prev => [...prev, created]);
    return created;
  }, [dataService]);

  const updateConcern = React.useCallback(async (projectCode: string, concernId: number, data: Partial<IQualityConcern>) => {
    const updated = await dataService.updateQualityConcern(projectCode, concernId, data);
    setConcerns(prev => prev.map(c => c.id === concernId ? updated : c));
    return updated;
  }, [dataService]);

  const openCount = React.useMemo(() => concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length, [concerns]);
  const resolvedCount = React.useMemo(() => concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length, [concerns]);

  return { concerns, isLoading, error, fetchConcerns, addConcern, updateConcern, openCount, resolvedCount };
}
