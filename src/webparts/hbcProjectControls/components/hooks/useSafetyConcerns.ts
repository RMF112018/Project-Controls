import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ISafetyConcern } from '../../models/ISafetyConcerns';

interface IUseSafetyConcernsResult {
  concerns: ISafetyConcern[];
  isLoading: boolean;
  error: string | null;
  safetyOfficer: { name: string; email: string } | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  bySeverity: Record<string, ISafetyConcern[]>;
}

export function useSafetyConcerns(): IUseSafetyConcernsResult {
  const { dataService } = useAppContext();
  const [concerns, setConcerns] = React.useState<ISafetyConcern[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchConcerns = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getSafetyConcerns(projectCode);
      setConcerns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safety concerns');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const addConcern = React.useCallback(async (projectCode: string, concern: Partial<ISafetyConcern>) => {
    const created = await dataService.addSafetyConcern(projectCode, concern);
    setConcerns(prev => [...prev, created]);
    return created;
  }, [dataService]);

  const updateConcern = React.useCallback(async (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) => {
    const updated = await dataService.updateSafetyConcern(projectCode, concernId, data);
    setConcerns(prev => prev.map(c => c.id === concernId ? updated : c));
    return updated;
  }, [dataService]);

  const safetyOfficer = React.useMemo(() => {
    const first = concerns.find(c => c.safetyOfficerName);
    return first ? { name: first.safetyOfficerName, email: first.safetyOfficerEmail } : null;
  }, [concerns]);

  const bySeverity = React.useMemo(() => {
    const grouped: Record<string, ISafetyConcern[]> = {};
    concerns.forEach(c => {
      if (!grouped[c.severity]) grouped[c.severity] = [];
      grouped[c.severity].push(c);
    });
    return grouped;
  }, [concerns]);

  return { concerns, isLoading, error, safetyOfficer, fetchConcerns, addConcern, updateConcern, bySeverity };
}
