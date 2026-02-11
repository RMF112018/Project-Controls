import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IAssignmentMapping, AssignmentType } from '../../models';

interface IUseAssignmentMappingsResult {
  mappings: IAssignmentMapping[];
  isLoading: boolean;
  error: string | null;
  fetchMappings: () => Promise<void>;
  createMapping: (data: Partial<IAssignmentMapping>) => Promise<IAssignmentMapping>;
  updateMapping: (id: number, data: Partial<IAssignmentMapping>) => Promise<IAssignmentMapping>;
  deleteMapping: (id: number) => Promise<void>;
  resolveAssignee: (region: string, sector: string, type: AssignmentType) => IAssignmentMapping | null;
}

export function useAssignmentMappings(): IUseAssignmentMappingsResult {
  const { dataService } = useAppContext();
  const [mappings, setMappings] = React.useState<IAssignmentMapping[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMappings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getAssignmentMappings();
      setMappings(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment mappings');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const createMapping = React.useCallback(async (data: Partial<IAssignmentMapping>) => {
    const created = await dataService.createAssignmentMapping(data);
    setMappings(prev => [...prev, created]);
    return created;
  }, [dataService]);

  const updateMapping = React.useCallback(async (id: number, data: Partial<IAssignmentMapping>) => {
    const updated = await dataService.updateAssignmentMapping(id, data);
    setMappings(prev => prev.map(m => m.id === id ? updated : m));
    return updated;
  }, [dataService]);

  const deleteMapping = React.useCallback(async (id: number) => {
    await dataService.deleteAssignmentMapping(id);
    setMappings(prev => prev.filter(m => m.id !== id));
  }, [dataService]);

  /**
   * Resolve the best-matching assignee for a given region, sector, and type.
   * Priority: exact region+sector → exact region+"All Sectors" → "All Regions"+exact sector → "All Regions"+"All Sectors"
   */
  const resolveAssignee = React.useCallback((region: string, sector: string, type: AssignmentType): IAssignmentMapping | null => {
    const candidates = mappings.filter(m => m.assignmentType === type);

    // Priority 1: Exact region + exact sector
    const exact = candidates.find(m => m.region === region && m.sector === sector);
    if (exact) return exact;

    // Priority 2: Exact region + "All Sectors"
    const regionOnly = candidates.find(m => m.region === region && m.sector === 'All Sectors');
    if (regionOnly) return regionOnly;

    // Priority 3: "All Regions" + exact sector
    const sectorOnly = candidates.find(m => m.region === 'All Regions' && m.sector === sector);
    if (sectorOnly) return sectorOnly;

    // Priority 4: "All Regions" + "All Sectors" (fallback)
    const fallback = candidates.find(m => m.region === 'All Regions' && m.sector === 'All Sectors');
    return fallback || null;
  }, [mappings]);

  return {
    mappings, isLoading, error,
    fetchMappings, createMapping, updateMapping, deleteMapping,
    resolveAssignee,
  };
}
