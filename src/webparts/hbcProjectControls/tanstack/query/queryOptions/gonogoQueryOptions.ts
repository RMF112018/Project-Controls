/**
 * Phase 1 (GNG Plan) — Query-options factories for Go/No-Go Scorecard data.
 * Consumed by GoNoGoPage, GoNoGoScorecard, and useGoNoGoMutation for
 * cache invalidation targets.
 *
 * Pattern mirrors estimatingQueryOptions.ts.
 */
import { queryOptions, useQuery } from '@tanstack/react-query';
import type {
  IDataService,
  IGoNoGoScorecard,
  IScorecardVersion,
  IScorecardCriterionComment,
  IScorecardNote,
  ILead,
} from '@hbc/sp-services';
import type { IAuditEntry } from '@hbc/sp-services';
import type { IQueryScope } from '../queryKeys';
import { qk } from '../queryKeys';
import { QUERY_STALE_TIMES } from '../cachePolicies';
import { useAppContext } from '../../../components/contexts/AppContext';
import { useQueryScope } from '../useQueryScope';

// ── Query Options Factories ────────────────────────────────────────────

export function gonogoScorecardByLeadIdOptions(
  scope: IQueryScope,
  leadId: number,
  dataService: IDataService,
) {
  return queryOptions<IGoNoGoScorecard | null>({
    queryKey: qk.gonogo.byLeadId(scope, leadId),
    queryFn: () => dataService.getScorecardByLeadId(leadId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: leadId > 0,
  });
}

export function gonogoScorecardsOptions(
  scope: IQueryScope,
  dataService: IDataService,
) {
  return queryOptions<IGoNoGoScorecard[]>({
    queryKey: qk.gonogo.scorecards(scope),
    queryFn: () => dataService.getScorecards(),
    staleTime: QUERY_STALE_TIMES.gonogo,
  });
}

export function gonogoVersionsOptions(
  scope: IQueryScope,
  scorecardId: number,
  dataService: IDataService,
) {
  return queryOptions<IScorecardVersion[]>({
    queryKey: qk.gonogo.versions(scope, scorecardId),
    queryFn: () => dataService.getScorecardVersions(scorecardId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: scorecardId > 0,
  });
}

// ── Convenience Hook: useGoNoGoEvaluation ──────────────────────────────

export interface IUseGoNoGoEvaluationResult {
  scorecard: IGoNoGoScorecard | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Loads a single Go/No-Go scorecard by lead ID.
 * Feature-flag gated behind `GoNoGoScorecard`.
 */
export function useGoNoGoEvaluation(leadId: number): IUseGoNoGoEvaluationResult {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();

  const opts = gonogoScorecardByLeadIdOptions(scope, leadId, dataService);

  const { data, isLoading, error, refetch } = useQuery({
    ...opts,
    enabled: leadId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });

  return {
    scorecard: data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// ── Phase 3: Collaboration Query Options ────────────────────────────────

export function gonogoCommentsOptions(
  scope: IQueryScope,
  scorecardId: number,
  dataService: IDataService,
) {
  return queryOptions<IScorecardCriterionComment[]>({
    queryKey: qk.gonogo.comments(scope, scorecardId),
    queryFn: () => dataService.getScorecardComments(scorecardId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: scorecardId > 0,
  });
}

export function gonogoNotesOptions(
  scope: IQueryScope,
  scorecardId: number,
  dataService: IDataService,
) {
  return queryOptions<IScorecardNote[]>({
    queryKey: qk.gonogo.notes(scope, scorecardId),
    queryFn: () => dataService.getScorecardNotes(scorecardId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: scorecardId > 0,
  });
}

export function gonogoAuditLogOptions(
  scope: IQueryScope,
  scorecardId: number,
  dataService: IDataService,
) {
  return queryOptions<IAuditEntry[]>({
    queryKey: qk.gonogo.auditLog(scope, scorecardId),
    queryFn: () => dataService.getScorecardAuditLog(scorecardId),
    staleTime: QUERY_STALE_TIMES.gonogo,
    enabled: scorecardId > 0,
  });
}

// ── Phase 4: Lead Data Query ─────────────────────────────────────────────

export function gonogoLeadByIdOptions(
  scope: IQueryScope,
  leadId: number,
  dataService: IDataService,
) {
  return queryOptions<ILead | null>({
    queryKey: qk.leads.byId(scope, leadId),
    queryFn: () => dataService.getLeadById(leadId),
    staleTime: QUERY_STALE_TIMES.leads,
    enabled: leadId > 0,
  });
}

// ── Convenience Hooks: Phase 3 Collaboration ───────────────────────────

export function useGoNoGoComments(scorecardId: number) {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const opts = gonogoCommentsOptions(scope, scorecardId, dataService);
  const { data, isLoading, error } = useQuery({
    ...opts,
    enabled: scorecardId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });
  return { data: data ?? [], isLoading, error: error as Error | null };
}

export function useGoNoGoNotes(scorecardId: number) {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const opts = gonogoNotesOptions(scope, scorecardId, dataService);
  const { data, isLoading, error } = useQuery({
    ...opts,
    enabled: scorecardId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });
  return { data: data ?? [], isLoading, error: error as Error | null };
}

export function useGoNoGoAuditLog(scorecardId: number) {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const opts = gonogoAuditLogOptions(scope, scorecardId, dataService);
  const { data, isLoading, error } = useQuery({
    ...opts,
    enabled: scorecardId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });
  return { data: data ?? [], isLoading, error: error as Error | null };
}

export function useGoNoGoVersions(scorecardId: number) {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const opts = gonogoVersionsOptions(scope, scorecardId, dataService);
  const { data, isLoading, error } = useQuery({
    ...opts,
    enabled: scorecardId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });
  return { data: data ?? [], isLoading, error: error as Error | null };
}

// ── Phase 4: Lead Data Hook ─────────────────────────────────────────────

export function useGoNoGoLeadData(leadId: number) {
  const { dataService, isFeatureEnabled } = useAppContext();
  const scope = useQueryScope();
  const opts = gonogoLeadByIdOptions(scope, leadId, dataService);
  const { data, isLoading, error } = useQuery({
    ...opts,
    enabled: leadId > 0 && isFeatureEnabled('GoNoGoScorecard'),
  });
  return { lead: data ?? null, isLoading, error: error as Error | null };
}
