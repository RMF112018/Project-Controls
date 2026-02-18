export type QueryMode = 'mock' | 'standalone' | 'sharepoint';
export type QuerySiteContext = 'hub' | 'project';

export interface IQueryScope {
  mode: QueryMode;
  siteContext: QuerySiteContext;
  siteUrl: string;
  projectCode: string | null;
}

export const qk = {
  scope: (scope: IQueryScope) => ['scope', scope.mode, scope.siteContext, scope.siteUrl, scope.projectCode] as const,
  activeProjects: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'activeProjects'] as const,
    list: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'activeProjects', 'list', filtersHash] as const,
    summary: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'activeProjects', 'summary', filtersHash] as const,
    personnelWorkload: (scope: IQueryScope, role: 'PX' | 'PM' | 'Super' | 'all') => [...qk.scope(scope), 'activeProjects', 'personnelWorkload', role] as const,
  },
  dataMart: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'dataMart'] as const,
    records: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'dataMart', 'records', filtersHash] as const,
    record: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'dataMart', 'record', projectCode] as const,
  },
  compliance: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'compliance'] as const,
    log: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'compliance', 'log', filtersHash] as const,
    summary: (scope: IQueryScope) => [...qk.scope(scope), 'compliance', 'summary'] as const,
  },
  permission: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'permission'] as const,
    templates: (scope: IQueryScope) => [...qk.scope(scope), 'permission', 'templates'] as const,
    mappings: (scope: IQueryScope) => [...qk.scope(scope), 'permission', 'mappings'] as const,
    assignmentsRoot: (scope: IQueryScope) => [...qk.scope(scope), 'permission', 'assignments'] as const,
    assignments: (scope: IQueryScope, projectCode?: string) => [...qk.scope(scope), 'permission', 'assignments', projectCode ?? 'all'] as const,
  },
  buyout: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'buyout'] as const,
    entries: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'buyout', 'entries', projectCode] as const,
    approvalHistory: (scope: IQueryScope, projectCode: string, entryId: number) =>
      [...qk.scope(scope), 'buyout', 'approvalHistory', projectCode, entryId] as const,
    trackingHistory: (scope: IQueryScope, projectCode: string, entryId: number) =>
      [...qk.scope(scope), 'buyout', 'trackingHistory', projectCode, entryId] as const,
    trackingChain: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'buyout', 'trackingChain', projectCode] as const,
  },
};
