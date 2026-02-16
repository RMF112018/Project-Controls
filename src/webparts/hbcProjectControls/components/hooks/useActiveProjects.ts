import {
  IActiveProject,
  IPortfolioSummary,
  IPersonnelWorkload,
  ProjectStatus,
  SectorType,
  IActiveProjectsFilter,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';

export interface IActiveProjectsFilters {
  status?: ProjectStatus;
  sector?: SectorType;
  projectExecutive?: string;
  projectManager?: string;
  region?: string;
  searchQuery?: string;
}

export interface UseActiveProjectsReturn {
  // Data
  projects: IActiveProject[];
  filteredProjects: IActiveProject[];
  summary: IPortfolioSummary | null;
  personnelWorkload: IPersonnelWorkload[];

  // State
  isLoading: boolean;
  error: string | null;
  filters: IActiveProjectsFilters;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchSummary: (filters?: IActiveProjectsFilter) => Promise<void>;
  fetchPersonnelWorkload: (role?: 'PX' | 'PM' | 'Super') => Promise<void>;
  setFilters: (filters: IActiveProjectsFilters) => void;
  clearFilters: () => void;
  syncProject: (projectCode: string) => Promise<void>;
  triggerFullSync: () => Promise<void>;

  // Computed values
  uniqueProjectExecutives: string[];
  uniqueProjectManagers: string[];
  uniqueRegions: string[];
  projectsWithAlerts: IActiveProject[];
}

export function useActiveProjects(): UseActiveProjectsReturn {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();

  const [projects, setProjects] = useState<IActiveProject[]>([]);
  const [summary, setSummary] = useState<IPortfolioSummary | null>(null);
  const [personnelWorkload, setPersonnelWorkload] = useState<IPersonnelWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<IActiveProjectsFilters>({});

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getActiveProjects({
        status: filters.status,
        sector: filters.sector,
        projectExecutive: filters.projectExecutive,
        projectManager: filters.projectManager,
        region: filters.region,
      });
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active projects');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, filters.status, filters.sector, filters.projectExecutive, filters.projectManager, filters.region]);

  // SignalR: refresh on Project entity changes
  useSignalR({
    entityType: EntityType.Project,
    onEntityChanged: useCallback(() => { fetchProjects(); }, [fetchProjects]),
  });

  const broadcastProjectChange = useCallback((
    projectCode: string,
    action: IEntityChangedMessage['action'],
    summaryText?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Project,
      entityId: projectCode,
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary: summaryText,
    });
  }, [broadcastChange, currentUser]);

  const fetchSummary = useCallback(async (summaryFilters?: IActiveProjectsFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getPortfolioSummary(summaryFilters);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio summary');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchPersonnelWorkload = useCallback(async (role?: 'PX' | 'PM' | 'Super') => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getPersonnelWorkload(role);
      setPersonnelWorkload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch personnel workload');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const setFilters = useCallback((newFilters: IActiveProjectsFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const syncProject = useCallback(async (projectCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await dataService.syncActiveProject(projectCode);
      await fetchProjects();
      broadcastProjectChange(projectCode, 'updated', 'Project synced');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync project');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, fetchProjects, broadcastProjectChange]);

  const triggerFullSync = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await dataService.triggerPortfolioSync();
      await fetchProjects();
      await fetchSummary();
      broadcastProjectChange('portfolio', 'updated', 'Full portfolio sync');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger portfolio sync');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, fetchProjects, fetchSummary, broadcastProjectChange]);

  // Apply search filter locally
  const filteredProjects = useMemo(() => {
    if (!filters.searchQuery) return projects;

    const query = filters.searchQuery.toLowerCase();
    return projects.filter(p =>
      p.projectName.toLowerCase().includes(query) ||
      p.jobNumber.toLowerCase().includes(query) ||
      p.projectCode.toLowerCase().includes(query) ||
      (p.personnel.projectExecutive?.toLowerCase().includes(query)) ||
      (p.personnel.leadPM?.toLowerCase().includes(query))
    );
  }, [projects, filters.searchQuery]);

  // Computed unique values for filter dropdowns
  const uniqueProjectExecutives = useMemo(() => {
    const executives = new Set<string>();
    projects.forEach(p => {
      if (p.personnel.projectExecutive) {
        executives.add(p.personnel.projectExecutive);
      }
    });
    return Array.from(executives).sort();
  }, [projects]);

  const uniqueProjectManagers = useMemo(() => {
    const managers = new Set<string>();
    projects.forEach(p => {
      if (p.personnel.leadPM) {
        managers.add(p.personnel.leadPM);
      }
    });
    return Array.from(managers).sort();
  }, [projects]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set<string>();
    projects.forEach(p => {
      if (p.region) {
        regions.add(p.region);
      }
    });
    return Array.from(regions).sort();
  }, [projects]);

  const projectsWithAlerts = useMemo(() => {
    return projects.filter(p =>
      p.hasUnbilledAlert || p.hasScheduleAlert || p.hasFeeErosionAlert
    );
  }, [projects]);

  return {
    projects,
    filteredProjects,
    summary,
    personnelWorkload,
    isLoading,
    error,
    filters,
    fetchProjects,
    fetchSummary,
    fetchPersonnelWorkload,
    setFilters,
    clearFilters,
    syncProject,
    triggerFullSync,
    uniqueProjectExecutives,
    uniqueProjectManagers,
    uniqueRegions,
    projectsWithAlerts,
  };
}
