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
    infinite: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'compliance', 'infinite', filtersHash] as const,
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
    infinite: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'buyout', 'infinite', projectCode] as const,
    approvalHistory: (scope: IQueryScope, projectCode: string, entryId: number) =>
      [...qk.scope(scope), 'buyout', 'approvalHistory', projectCode, entryId] as const,
    trackingHistory: (scope: IQueryScope, projectCode: string, entryId: number) =>
      [...qk.scope(scope), 'buyout', 'trackingHistory', projectCode, entryId] as const,
    trackingChain: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'buyout', 'trackingChain', projectCode] as const,
  },
  constraints: {
    base: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'constraints', projectCode] as const,
    infinite: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'constraints', 'infinite', projectCode] as const,
  },
  permits: {
    base: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'permits', projectCode] as const,
    infinite: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'permits', 'infinite', projectCode] as const,
  },
  startupChecklist: {
    base: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'startupChecklist', projectCode] as const,
    infinite: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'startupChecklist', 'infinite', projectCode] as const,
  },
  audit: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'audit'] as const,
    infinite: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'audit', 'infinite', filtersHash] as const,
  },
  // Wave 2A: Preconstruction
  leads: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'leads'] as const,
    list: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'leads', 'list', filtersHash] as const,
    byStage: (scope: IQueryScope, stage: string) => [...qk.scope(scope), 'leads', 'byStage', stage] as const,
    search: (scope: IQueryScope, query: string) => [...qk.scope(scope), 'leads', 'search', query] as const,
    byId: (scope: IQueryScope, id: number) => [...qk.scope(scope), 'leads', 'byId', id] as const,
  },
  estimating: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'estimating'] as const,
    records: (scope: IQueryScope, filtersHash: string) => [...qk.scope(scope), 'estimating', 'records', filtersHash] as const,
    pursuits: (scope: IQueryScope) => [...qk.scope(scope), 'estimating', 'pursuits'] as const,
    engagements: (scope: IQueryScope) => [...qk.scope(scope), 'estimating', 'engagements'] as const,
    log: (scope: IQueryScope) => [...qk.scope(scope), 'estimating', 'log'] as const,
    byId: (scope: IQueryScope, id: number) => [...qk.scope(scope), 'estimating', 'byId', id] as const,
  },
  gonogo: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'gonogo'] as const,
    scorecards: (scope: IQueryScope) => [...qk.scope(scope), 'gonogo', 'scorecards'] as const,
    byLeadId: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'gonogo', 'byLeadId', leadId] as const,
    versions: (scope: IQueryScope, scorecardId: number) => [...qk.scope(scope), 'gonogo', 'versions', scorecardId] as const,
  },
  scorecards: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'gonogo', 'scorecards'] as const,
    byLead: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'gonogo', 'byLeadId', leadId] as const,
    versions: (scope: IQueryScope, scorecardId: number) => [...qk.scope(scope), 'gonogo', 'versions', scorecardId] as const,
  },
  kickoff: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'kickoff'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'kickoff', 'byProject', projectCode] as const,
    byLeadId: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'kickoff', 'byLeadId', leadId] as const,
  },
  autopsy: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'autopsy'] as const,
    all: (scope: IQueryScope) => [...qk.scope(scope), 'autopsy', 'all'] as const,
    byLeadId: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'autopsy', 'byLeadId', leadId] as const,
  },
  postBidAutopsy: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'postBidAutopsy'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'postBidAutopsy', 'byProject', projectCode] as const,
    byLeadId: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'postBidAutopsy', 'byLeadId', leadId] as const,
  },
  jobNumber: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'jobNumber'] as const,
    list: (scope: IQueryScope, statusHash: string) => [...qk.scope(scope), 'jobNumber', 'list', statusHash] as const,
    byLeadId: (scope: IQueryScope, leadId: number) => [...qk.scope(scope), 'jobNumber', 'byLeadId', leadId] as const,
    referenceData: (scope: IQueryScope) => [...qk.scope(scope), 'jobNumber', 'referenceData'] as const,
  },
  // Wave 2B: Operations
  schedule: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'schedule'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'schedule', 'byProject', projectCode] as const,
  },
  riskCost: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'riskCost'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'riskCost', 'byProject', projectCode] as const,
  },
  monthlyReview: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'monthlyReview'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'monthlyReview', 'byProject', projectCode] as const,
  },
  closeout: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'closeout'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'closeout', 'byProject', projectCode] as const,
  },
  superintendent: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'superintendent'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'superintendent', 'byProject', projectCode] as const,
  },
  lessonsLearned: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'lessonsLearned'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'lessonsLearned', 'byProject', projectCode] as const,
  },
  qualityConcerns: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'qualityConcerns'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'qualityConcerns', 'byProject', projectCode] as const,
  },
  safetyConcerns: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'safetyConcerns'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'safetyConcerns', 'byProject', projectCode] as const,
  },
  // Wave 2C: Complex entities
  turnover: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'turnover'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'turnover', 'byProject', projectCode] as const,
    workflowChain: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'turnover', 'workflowChain', projectCode] as const,
  },
  marketing: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'marketing'] as const,
    all: (scope: IQueryScope) => [...qk.scope(scope), 'marketing', 'all'] as const,
    byProject: (scope: IQueryScope, projectCode: string) => [...qk.scope(scope), 'marketing', 'byProject', projectCode] as const,
  },
  actionInbox: {
    base: (scope: IQueryScope) => [...qk.scope(scope), 'actionInbox'] as const,
    items: (scope: IQueryScope, userEmail: string) => [...qk.scope(scope), 'actionInbox', 'items', userEmail] as const,
  },
};
