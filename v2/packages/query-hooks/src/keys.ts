/**
 * Centralized query key factory for TanStack Query.
 *
 * Follows the @lukemorales/query-key-factory pattern:
 * - All keys are tuples (readonly arrays)
 * - Hierarchical: domain > scope > params
 * - Enables precise cache invalidation
 */
export const queryKeys = {
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.leads.details(), id] as const,
    byStage: (stage: string) => [...queryKeys.leads.all, 'stage', stage] as const,
    search: (query: string) => [...queryKeys.leads.all, 'search', query] as const,
  },

  scorecards: {
    all: ['scorecards'] as const,
    lists: () => [...queryKeys.scorecards.all, 'list'] as const,
    byLead: (leadId: number) => [...queryKeys.scorecards.all, 'lead', leadId] as const,
    versions: (scorecardId: number) => [...queryKeys.scorecards.all, 'versions', scorecardId] as const,
  },

  estimating: {
    all: ['estimating'] as const,
    lists: () => [...queryKeys.estimating.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.estimating.lists(), filters] as const,
    detail: (id: number) => [...queryKeys.estimating.all, 'detail', id] as const,
    byLead: (leadId: number) => [...queryKeys.estimating.all, 'lead', leadId] as const,
    pursuits: () => [...queryKeys.estimating.all, 'pursuits'] as const,
    engagements: () => [...queryKeys.estimating.all, 'engagements'] as const,
    kickoff: (projectCode: string) => [...queryKeys.estimating.all, 'kickoff', projectCode] as const,
    kickoffByLead: (leadId: number) => [...queryKeys.estimating.all, 'kickoff-lead', leadId] as const,
  },

  schedule: {
    all: (projectCode: string) => ['schedule', projectCode] as const,
    activities: (projectCode: string) => [...queryKeys.schedule.all(projectCode), 'activities'] as const,
    metrics: (projectCode: string) => [...queryKeys.schedule.all(projectCode), 'metrics'] as const,
    criticalPath: (projectCode: string) => [...queryKeys.schedule.all(projectCode), 'critical-path'] as const,
    imports: (projectCode: string) => [...queryKeys.schedule.all(projectCode), 'imports'] as const,
  },

  buyout: {
    all: (projectCode: string) => ['buyout', projectCode] as const,
    entries: (projectCode: string) => [...queryKeys.buyout.all(projectCode), 'entries'] as const,
    approvalHistory: (projectCode: string, entryId: number) => [...queryKeys.buyout.all(projectCode), 'approval', entryId] as const,
    contractHistory: (projectCode: string, entryId: number) => [...queryKeys.buyout.all(projectCode), 'contract', entryId] as const,
  },

  compliance: {
    all: ['compliance'] as const,
    log: (filters?: Record<string, unknown>) => [...queryKeys.compliance.all, 'log', filters] as const,
    summary: () => [...queryKeys.compliance.all, 'summary'] as const,
  },

  contracts: {
    all: (projectCode: string) => ['contracts', projectCode] as const,
    info: (projectCode: string) => [...queryKeys.contracts.all(projectCode), 'info'] as const,
    internalMatrix: (projectCode: string) => [...queryKeys.contracts.all(projectCode), 'internal-matrix'] as const,
    teamRoles: (projectCode: string) => [...queryKeys.contracts.all(projectCode), 'team-roles'] as const,
    ownerMatrix: (projectCode: string) => [...queryKeys.contracts.all(projectCode), 'owner-matrix'] as const,
    subMatrix: (projectCode: string) => [...queryKeys.contracts.all(projectCode), 'sub-matrix'] as const,
  },

  risk: {
    all: (projectCode: string) => ['risk', projectCode] as const,
    costManagement: (projectCode: string) => [...queryKeys.risk.all(projectCode), 'cost-management'] as const,
    quality: (projectCode: string) => [...queryKeys.risk.all(projectCode), 'quality'] as const,
    safety: (projectCode: string) => [...queryKeys.risk.all(projectCode), 'safety'] as const,
  },

  pmp: {
    all: (projectCode: string) => ['pmp', projectCode] as const,
    plan: (projectCode: string) => [...queryKeys.pmp.all(projectCode), 'plan'] as const,
    superintendent: (projectCode: string) => [...queryKeys.pmp.all(projectCode), 'superintendent'] as const,
    monthlyReviews: (projectCode: string) => [...queryKeys.pmp.all(projectCode), 'monthly-reviews'] as const,
    monthlyReview: (reviewId: number) => ['pmp', 'monthly-review', reviewId] as const,
    divisionApprovers: () => ['pmp', 'division-approvers'] as const,
    boilerplate: () => ['pmp', 'boilerplate'] as const,
  },

  project: {
    all: ['projects'] as const,
    active: (filters?: Record<string, unknown>) => [...queryKeys.project.all, 'active', filters] as const,
    detail: (id: number) => [...queryKeys.project.all, 'detail', id] as const,
    portfolio: (filters?: Record<string, unknown>) => [...queryKeys.project.all, 'portfolio', filters] as const,
    workload: (role?: string) => [...queryKeys.project.all, 'workload', role] as const,
    team: (projectCode: string) => [...queryKeys.project.all, 'team', projectCode] as const,
    deliverables: (projectCode: string) => [...queryKeys.project.all, 'deliverables', projectCode] as const,
    checklist: (projectCode: string) => [...queryKeys.project.all, 'checklist', projectCode] as const,
    lessons: (projectCode: string) => [...queryKeys.project.all, 'lessons', projectCode] as const,
    constraints: (projectCode: string) => [...queryKeys.project.all, 'constraints', projectCode] as const,
    permits: (projectCode: string) => [...queryKeys.project.all, 'permits', projectCode] as const,
  },

  turnover: {
    all: (projectCode: string) => ['turnover', projectCode] as const,
    agenda: (projectCode: string) => [...queryKeys.turnover.all(projectCode), 'agenda'] as const,
  },

  auth: {
    currentUser: () => ['auth', 'current-user'] as const,
    roles: () => ['auth', 'roles'] as const,
    featureFlags: () => ['auth', 'feature-flags'] as const,
    permissions: (userEmail: string, projectCode: string | null) => ['auth', 'permissions', userEmail, projectCode] as const,
    templates: () => ['auth', 'templates'] as const,
    template: (id: number) => ['auth', 'template', id] as const,
  },

  audit: {
    all: ['audit'] as const,
    log: (entityType?: string, entityId?: string) => [...queryKeys.audit.all, 'log', entityType, entityId] as const,
  },

  workflow: {
    all: ['workflow'] as const,
    definitions: () => [...queryKeys.workflow.all, 'definitions'] as const,
    definition: (key: string) => [...queryKeys.workflow.all, 'definition', key] as const,
    chain: (key: string, projectCode: string) => [...queryKeys.workflow.all, 'chain', key, projectCode] as const,
  },
} as const;
