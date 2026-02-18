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
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import {
  activeProjectsListOptions,
  activeProjectsSummaryOptions,
  activeProjectsWorkloadOptions,
} from '../../tanstack/query/queryOptions/activeProjects';
import { qk } from '../../tanstack/query/queryKeys';
import { makePortfolioSyncMutation, makeSyncProjectMutation } from '../../tanstack/query/mutations/portfolio';

export interface IActiveProjectsFilters {
  status?: ProjectStatus;
  sector?: SectorType;
  projectExecutive?: string;
  projectManager?: string;
  region?: string;
  searchQuery?: string;
}

export interface UseActiveProjectsReturn {
  projects: IActiveProject[];
  filteredProjects: IActiveProject[];
  summary: IPortfolioSummary | null;
  personnelWorkload: IPersonnelWorkload[];
  isLoading: boolean;
  error: string | null;
  filters: IActiveProjectsFilters;
  fetchProjects: () => Promise<void>;
  fetchSummary: (filters?: IActiveProjectsFilter) => Promise<void>;
  fetchPersonnelWorkload: (role?: 'PX' | 'PM' | 'Super') => Promise<void>;
  setFilters: (filters: IActiveProjectsFilters) => void;
  clearFilters: () => void;
  syncProject: (projectCode: string) => Promise<void>;
  triggerFullSync: () => Promise<void>;
  uniqueProjectExecutives: string[];
  uniqueProjectManagers: string[];
  uniqueRegions: string[];
  projectsWithAlerts: IActiveProject[];
}

export function useActiveProjects(): UseActiveProjectsReturn {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();

  const [filters, setFiltersState] = React.useState<IActiveProjectsFilters>({});
  const [summaryFilters, setSummaryFilters] = React.useState<IActiveProjectsFilter | undefined>(undefined);
  const [workloadRole, setWorkloadRole] = React.useState<'PX' | 'PM' | 'Super' | undefined>(undefined);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const activeFilters = React.useMemo<IActiveProjectsFilter>(() => ({
    status: filters.status,
    sector: filters.sector,
    projectExecutive: filters.projectExecutive,
    projectManager: filters.projectManager,
    region: filters.region,
  }), [filters.status, filters.sector, filters.projectExecutive, filters.projectManager, filters.region]);

  const projectsQuery = useQuery(activeProjectsListOptions(scope, dataService, activeFilters));
  const summaryQuery = useQuery(activeProjectsSummaryOptions(scope, dataService, summaryFilters));
  const personnelWorkloadQuery = useQuery(activeProjectsWorkloadOptions(scope, dataService, workloadRole));

  const syncProjectMutation = useMutation({
    mutationFn: makeSyncProjectMutation(dataService),
  });

  const fullSyncMutation = useMutation({
    mutationFn: makePortfolioSyncMutation(dataService),
  });

  const broadcastProjectChange = React.useCallback((
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

  useSignalR({
    entityType: EntityType.Project,
    onEntityChanged: React.useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: qk.scope(scope) });
    }, [queryClient, scope]),
  });

  const fetchProjects = React.useCallback(async () => {
    setLocalError(null);
    try {
      await queryClient.fetchQuery(activeProjectsListOptions(scope, dataService, activeFilters));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch active projects');
    }
  }, [queryClient, scope, dataService, activeFilters]);

  const fetchSummary = React.useCallback(async (nextFilters?: IActiveProjectsFilter) => {
    setLocalError(null);
    setSummaryFilters(nextFilters);
    try {
      await queryClient.fetchQuery(activeProjectsSummaryOptions(scope, dataService, nextFilters));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch portfolio summary');
    }
  }, [queryClient, scope, dataService]);

  const fetchPersonnelWorkload = React.useCallback(async (role?: 'PX' | 'PM' | 'Super') => {
    setLocalError(null);
    setWorkloadRole(role);
    try {
      await queryClient.fetchQuery(activeProjectsWorkloadOptions(scope, dataService, role));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch personnel workload');
    }
  }, [queryClient, scope, dataService]);

  const setFilters = React.useCallback((newFilters: IActiveProjectsFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = React.useCallback(() => {
    setFiltersState({});
  }, []);

  const syncProject = React.useCallback(async (projectCode: string) => {
    setLocalError(null);
    try {
      await syncProjectMutation.mutateAsync({ projectCode });
      await queryClient.invalidateQueries({ queryKey: qk.scope(scope) });
      broadcastProjectChange(projectCode, 'updated', 'Project synced');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to sync project');
    }
  }, [syncProjectMutation, queryClient, scope, broadcastProjectChange]);

  const triggerFullSync = React.useCallback(async () => {
    setLocalError(null);
    try {
      await fullSyncMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: qk.scope(scope) });
      broadcastProjectChange('portfolio', 'updated', 'Full portfolio sync');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to trigger portfolio sync');
    }
  }, [fullSyncMutation, queryClient, scope, broadcastProjectChange]);

  const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const summary = React.useMemo(() => summaryQuery.data ?? null, [summaryQuery.data]);
  const personnelWorkload = React.useMemo(() => personnelWorkloadQuery.data ?? [], [personnelWorkloadQuery.data]);

  const filteredProjects = React.useMemo(() => {
    if (!filters.searchQuery) return projects;

    const query = filters.searchQuery.toLowerCase();
    return projects.filter((p) =>
      p.projectName.toLowerCase().includes(query) ||
      p.jobNumber.toLowerCase().includes(query) ||
      p.projectCode.toLowerCase().includes(query) ||
      (p.personnel.projectExecutive?.toLowerCase().includes(query)) ||
      (p.personnel.leadPM?.toLowerCase().includes(query))
    );
  }, [projects, filters.searchQuery]);

  const uniqueProjectExecutives = React.useMemo(() => {
    const executives = new Set<string>();
    projects.forEach((p) => {
      if (p.personnel.projectExecutive) executives.add(p.personnel.projectExecutive);
    });
    return Array.from(executives).sort();
  }, [projects]);

  const uniqueProjectManagers = React.useMemo(() => {
    const managers = new Set<string>();
    projects.forEach((p) => {
      if (p.personnel.leadPM) managers.add(p.personnel.leadPM);
    });
    return Array.from(managers).sort();
  }, [projects]);

  const uniqueRegions = React.useMemo(() => {
    const regions = new Set<string>();
    projects.forEach((p) => {
      if (p.region) regions.add(p.region);
    });
    return Array.from(regions).sort();
  }, [projects]);

  const projectsWithAlerts = React.useMemo(() => {
    return projects.filter((p) => p.hasUnbilledAlert || p.hasScheduleAlert || p.hasFeeErosionAlert);
  }, [projects]);

  const queryError = projectsQuery.error ?? summaryQuery.error ?? personnelWorkloadQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);

  const isLoading =
    projectsQuery.isFetching ||
    summaryQuery.isFetching ||
    personnelWorkloadQuery.isFetching ||
    syncProjectMutation.isPending ||
    fullSyncMutation.isPending;

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
