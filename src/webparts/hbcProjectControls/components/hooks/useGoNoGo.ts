import {
  IGoNoGoScorecard,
  GoNoGoDecision,
  ScorecardStatus,
  IScorecardVersion,
  IPersonAssignment,
  RoleName,
  PERMISSIONS,
  getRecommendedDecision,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';
import { scorecardsListOptions } from '../../tanstack/query/queryOptions/gonogo';
import { qk } from '../../tanstack/query/queryKeys';

interface IRecommendation {
  decision: GoNoGoDecision;
  confidence: 'Strong' | 'Moderate' | 'Weak';
  reasoning: string;
}

interface IUseGoNoGoResult {
  scorecards: IGoNoGoScorecard[];
  isLoading: boolean;
  error: string | null;
  fetchScorecards: () => Promise<void>;
  getScorecardByLeadId: (leadId: number) => Promise<IGoNoGoScorecard | null>;
  createScorecard: (data: Partial<IGoNoGoScorecard>) => Promise<IGoNoGoScorecard>;
  updateScorecard: (id: number, data: Partial<IGoNoGoScorecard>) => Promise<IGoNoGoScorecard>;
  submitDecision: (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) => Promise<void>;
  // Workflow (Phase 16)
  submitScorecard: (scorecardId: number, approverOverride?: IPersonAssignment) => Promise<IGoNoGoScorecard>;
  respondToSubmission: (scorecardId: number, approved: boolean, comment: string) => Promise<IGoNoGoScorecard>;
  // Committee
  enterCommitteeScores: (scorecardId: number, scores: Record<string, number>) => Promise<IGoNoGoScorecard>;
  recommendedDecision: IRecommendation | null;
  computeRecommendation: (committeeTotal: number) => IRecommendation;
  // Decision
  recordDecision: (scorecardId: number, decision: GoNoGoDecision, conditions?: string) => Promise<IGoNoGoScorecard>;
  // Reject / Archive (Phase 22)
  rejectScorecard: (scorecardId: number, reason: string) => Promise<IGoNoGoScorecard>;
  archiveScorecard: (scorecardId: number) => Promise<IGoNoGoScorecard>;
  // Unlock
  canUnlock: boolean;
  unlockScorecard: (scorecardId: number, reason: string) => Promise<IGoNoGoScorecard>;
  relockScorecard: (scorecardId: number, startNewCycle: boolean) => Promise<IGoNoGoScorecard>;
  // Version
  versions: IScorecardVersion[];
  currentVersion: number;
  loadVersions: (scorecardId: number) => Promise<void>;
  // Computed status
  scorecardStatus: ScorecardStatus | null;
  isLocked: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canReviewDirector: boolean;
  canReviewCommittee: boolean;
  canEnterCommitteeScores: boolean;
  canDecide: boolean;
  canArchive: boolean;
}

export function useGoNoGo(): IUseGoNoGoResult {
  const { dataService, currentUser, hasPermission } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const queryClient = useQueryClient();
  const scope = useQueryScope();

  // Active scorecard for computed status (set when user navigates to a specific scorecard)
  const [activeScorecard, setActiveScorecard] = React.useState<IGoNoGoScorecard | null>(null);
  const [versions, setVersions] = React.useState<IScorecardVersion[]>([]);

  // TanStack Query: list of all scorecards
  const scorecardsQuery = useQuery(scorecardsListOptions(scope, dataService));

  const scorecards = scorecardsQuery.data ?? [];
  const isLoading = scorecardsQuery.isLoading;
  const error = scorecardsQuery.error?.message ?? null;

  // SignalR: invalidate all gonogo queries on entity changes
  useSignalRQueryInvalidation({
    entityType: EntityType.Scorecard,
    queryKeys: React.useMemo(() => [qk.gonogo.base(scope)], [scope]),
  });

  // Helper to broadcast scorecard changes
  const broadcastScorecardChange = React.useCallback((
    scorecardId: number,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Scorecard,
      entityId: String(scorecardId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  // Helper: invalidate and refetch all gonogo queries
  const invalidateAll = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.gonogo.base(scope) });
  }, [queryClient, scope]);

  const fetchScorecards = React.useCallback(async () => {
    await invalidateAll();
  }, [invalidateAll]);

  const getScorecardByLeadId = React.useCallback(async (leadId: number) => {
    try {
      const sc = await dataService.getScorecardByLeadId(leadId);
      if (sc) setActiveScorecard(sc);
      return sc;
    } catch {
      return null;
    }
  }, [dataService]);

  const createScorecard = React.useCallback(async (data: Partial<IGoNoGoScorecard>) => {
    const scorecard = await dataService.createScorecard(data);
    setActiveScorecard(scorecard);
    broadcastScorecardChange(scorecard.id, 'created', 'Scorecard created');
    void invalidateAll();
    return scorecard;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const updateScorecard = React.useCallback(async (id: number, data: Partial<IGoNoGoScorecard>) => {
    const updated = await dataService.updateScorecard(id, data);
    setActiveScorecard(updated);
    broadcastScorecardChange(id, 'updated', 'Scorecard updated');
    void invalidateAll();
    return updated;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const submitDecision = React.useCallback(async (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) => {
    await dataService.submitGoNoGoDecision(scorecardId, decision, projectCode);
    broadcastScorecardChange(scorecardId, 'updated', `Decision: ${decision}`);
    void invalidateAll();
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const submitScorecard = React.useCallback(async (scorecardId: number, approverOverride?: IPersonAssignment) => {
    const updated = await dataService.submitScorecard(scorecardId, currentUser?.email ?? 'unknown', approverOverride);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Submitted for review');
    void invalidateAll();
    return updated;
  }, [dataService, currentUser, broadcastScorecardChange, invalidateAll]);

  const respondToSubmission = React.useCallback(async (scorecardId: number, approved: boolean, comment: string) => {
    const updated = await dataService.respondToScorecardSubmission(scorecardId, approved, comment);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', approved ? 'Approved' : 'Returned for revision');
    void invalidateAll();
    return updated;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const enterCommitteeScores = React.useCallback(async (scorecardId: number, scores: Record<string, number>) => {
    const updated = await dataService.enterCommitteeScores(scorecardId, scores, currentUser?.email ?? 'unknown');
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Committee scores entered');
    void invalidateAll();
    return updated;
  }, [dataService, currentUser, broadcastScorecardChange, invalidateAll]);

  const computeRecommendation = React.useCallback((committeeTotal: number): IRecommendation => {
    return getRecommendedDecision(committeeTotal);
  }, []);

  const recordDecision = React.useCallback(async (scorecardId: number, decision: GoNoGoDecision, conditions?: string) => {
    const updated = await dataService.recordFinalDecision(scorecardId, decision, conditions, currentUser?.email);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', `Final decision: ${decision}`);
    void invalidateAll();
    return updated;
  }, [dataService, currentUser, broadcastScorecardChange, invalidateAll]);

  const rejectScorecard = React.useCallback(async (scorecardId: number, reason: string) => {
    const updated = await dataService.rejectScorecard(scorecardId, reason);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Scorecard rejected');
    void invalidateAll();
    return updated;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const archiveScorecard = React.useCallback(async (scorecardId: number) => {
    const updated = await dataService.archiveScorecard(scorecardId, currentUser?.displayName ?? 'Unknown');
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Scorecard archived');
    void invalidateAll();
    return updated;
  }, [dataService, currentUser, broadcastScorecardChange, invalidateAll]);

  const unlockScorecard = React.useCallback(async (scorecardId: number, reason: string) => {
    const updated = await dataService.unlockScorecard(scorecardId, reason);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Scorecard unlocked');
    void invalidateAll();
    return updated;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const relockScorecard = React.useCallback(async (scorecardId: number, startNewCycle: boolean) => {
    const updated = await dataService.relockScorecard(scorecardId, startNewCycle);
    setActiveScorecard(updated);
    broadcastScorecardChange(scorecardId, 'updated', 'Scorecard relocked');
    void invalidateAll();
    return updated;
  }, [dataService, broadcastScorecardChange, invalidateAll]);

  const loadVersions = React.useCallback(async (scorecardId: number) => {
    const v = await dataService.getScorecardVersions(scorecardId);
    setVersions(v);
  }, [dataService]);

  // --- Computed status ---

  const scorecardStatus = activeScorecard?.scorecardStatus ?? null;
  const isLocked = activeScorecard?.isLocked ?? false;
  const currentVersion = activeScorecard?.currentVersion ?? 1;

  const canEdit = React.useMemo(() => {
    if (!activeScorecard) return true;
    const status = activeScorecard.scorecardStatus;
    return (
      status === ScorecardStatus.BDDraft ||
      status === ScorecardStatus.DirectorReturnedForRevision ||
      status === ScorecardStatus.CommitteeReturnedForRevision ||
      status === ScorecardStatus.Unlocked
    );
  }, [activeScorecard]);

  const canSubmit = React.useMemo(() => {
    if (!activeScorecard) {
      return hasPermission(PERMISSIONS.GONOGO_SUBMIT);
    }
    const status = activeScorecard.scorecardStatus;
    return (
      (status === ScorecardStatus.BDDraft ||
       status === ScorecardStatus.DirectorReturnedForRevision ||
       status === ScorecardStatus.CommitteeReturnedForRevision ||
       status === ScorecardStatus.Unlocked) &&
      hasPermission(PERMISSIONS.GONOGO_SUBMIT)
    );
  }, [activeScorecard, hasPermission]);

  const isDirectorOrExec = currentUser?.roles?.includes(RoleName.ExecutiveLeadership)
    || currentUser?.roles?.includes(RoleName.DepartmentDirector)
    || false;

  const canReviewDirector = React.useMemo(() => {
    if (!activeScorecard) return false;
    if (activeScorecard.scorecardStatus !== ScorecardStatus.AwaitingDirectorReview) return false;
    if (isDirectorOrExec) return true;
    if (hasPermission(PERMISSIONS.GONOGO_REVIEW)) return true;
    const activeCycle = activeScorecard.approvalCycles?.find(c => c.status === 'Active');
    if (!activeCycle) return false;
    const pendingStep = activeCycle.steps?.find(s => s.status === 'Pending');
    if (!pendingStep) return false;
    const userEmail = currentUser?.email?.toLowerCase();
    return pendingStep.assigneeEmail?.toLowerCase() === userEmail;
  }, [activeScorecard, currentUser, hasPermission, isDirectorOrExec]);

  const canReview = canReviewDirector;

  const canReviewCommittee = React.useMemo(() => {
    if (!activeScorecard) return false;
    if (activeScorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) return false;
    if (isDirectorOrExec) return true;
    if (hasPermission(PERMISSIONS.GONOGO_SCORE_COMMITTEE)) return true;
    const userEmail = currentUser?.email?.toLowerCase();
    const isInCycle = activeScorecard.approvalCycles?.some(cycle =>
      cycle.steps?.some(step => step.assigneeEmail?.toLowerCase() === userEmail)
    ) || false;
    return isInCycle;
  }, [activeScorecard, currentUser, hasPermission, isDirectorOrExec]);

  const canEnterCommitteeScores = React.useMemo(() => {
    if (!activeScorecard) return false;
    if (activeScorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) return false;
    if (isDirectorOrExec) return true;
    const userEmail = currentUser?.email?.toLowerCase();
    const isInCycle = activeScorecard.approvalCycles?.some(cycle =>
      cycle.steps?.some(step => step.assigneeEmail?.toLowerCase() === userEmail)
    ) || false;
    return isInCycle || hasPermission(PERMISSIONS.GONOGO_SCORE_COMMITTEE);
  }, [activeScorecard, currentUser, hasPermission, isDirectorOrExec]);

  const canDecide = React.useMemo(() => {
    if (!activeScorecard) return false;
    if (activeScorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) return false;
    if (isDirectorOrExec) return true;
    const userEmail = currentUser?.email?.toLowerCase();
    const isInCycle = activeScorecard.approvalCycles?.some(cycle =>
      cycle.steps?.some(step => step.assigneeEmail?.toLowerCase() === userEmail)
    ) || false;
    return isInCycle || hasPermission(PERMISSIONS.GONOGO_DECIDE);
  }, [activeScorecard, currentUser, hasPermission, isDirectorOrExec]);

  const canUnlock = React.useMemo(() => {
    if (!activeScorecard || !activeScorecard.isLocked) return false;
    const userEmail = currentUser?.email?.toLowerCase();
    if (!userEmail) return false;
    const isInApprovalChain = activeScorecard.approvalCycles?.some(cycle =>
      cycle.steps?.some(step => step.assigneeEmail?.toLowerCase() === userEmail)
    ) || false;
    const isDirectorOrExecLocal = currentUser?.roles?.includes(RoleName.ExecutiveLeadership)
      || currentUser?.roles?.includes(RoleName.DepartmentDirector)
      || false;
    return isInApprovalChain || isDirectorOrExecLocal;
  }, [activeScorecard, currentUser]);

  const canArchive = React.useMemo(() => {
    if (!activeScorecard) return false;
    if (activeScorecard.isArchived) return false;
    const status = activeScorecard.scorecardStatus;
    return (
      status === ScorecardStatus.Rejected ||
      status === ScorecardStatus.NoGo ||
      status === ScorecardStatus.Go
    );
  }, [activeScorecard]);

  const recommendedDecision = React.useMemo(() => {
    if (!activeScorecard?.TotalScore_Cmte) return null;
    if (activeScorecard.scorecardStatus !== ScorecardStatus.AwaitingCommitteeScoring) return null;
    return getRecommendedDecision(activeScorecard.TotalScore_Cmte);
  }, [activeScorecard]);

  return {
    scorecards, isLoading, error,
    fetchScorecards, getScorecardByLeadId, createScorecard, updateScorecard, submitDecision,
    // Workflow
    submitScorecard, respondToSubmission,
    // Committee
    enterCommitteeScores, recommendedDecision, computeRecommendation,
    // Decision
    recordDecision,
    // Reject / Archive
    rejectScorecard, archiveScorecard,
    // Unlock
    canUnlock, unlockScorecard, relockScorecard,
    // Version
    versions, currentVersion, loadVersions,
    // Computed status
    scorecardStatus, isLocked, canEdit, canSubmit, canReview, canReviewDirector, canReviewCommittee,
    canEnterCommitteeScores, canDecide, canArchive,
  };
}
