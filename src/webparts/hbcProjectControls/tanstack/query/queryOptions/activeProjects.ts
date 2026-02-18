import { queryOptions } from '@tanstack/react-query';
import type { IDataService, IActiveProject, IPortfolioSummary, IActiveProjectsFilter, IPersonnelWorkload, ProjectStatus, SectorType } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { stableFilterHash } from './stableFilterHash';

export interface IActiveProjectsFilters {
  status?: ProjectStatus;
  sector?: SectorType;
  projectExecutive?: string;
  projectManager?: string;
  region?: string;
}

export function activeProjectsListOptions(
  scope: IQueryScope,
  dataService: IDataService,
  filters: IActiveProjectsFilters
) {
  const hash = stableFilterHash(filters);
  return queryOptions<IActiveProject[]>({
    queryKey: qk.activeProjects.list(scope, hash),
    queryFn: async () => {
      return dataService.getActiveProjects({
        status: filters.status,
        sector: filters.sector,
        projectExecutive: filters.projectExecutive,
        projectManager: filters.projectManager,
        region: filters.region,
      });
    },
  });
}

export function activeProjectsSummaryOptions(
  scope: IQueryScope,
  dataService: IDataService,
  filters?: IActiveProjectsFilter
) {
  const hash = stableFilterHash(filters);
  return queryOptions<IPortfolioSummary>({
    queryKey: qk.activeProjects.summary(scope, hash),
    queryFn: async () => dataService.getPortfolioSummary(filters),
  });
}

export function activeProjectsWorkloadOptions(
  scope: IQueryScope,
  dataService: IDataService,
  role?: 'PX' | 'PM' | 'Super'
) {
  const normalizedRole = role ?? 'all';
  return queryOptions<IPersonnelWorkload[]>({
    queryKey: qk.activeProjects.personnelWorkload(scope, normalizedRole),
    queryFn: async () => dataService.getPersonnelWorkload(role),
  });
}
