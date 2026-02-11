import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  IGoNoGoScorecard,
  GoNoGoDecision,
  ScorecardStatus,
  IScorecardVersion,
  IPersonAssignment,
  RoleName,
} from '../../models';
import { PERMISSIONS } from '../../utils/permissions';
import { getRecommendedDecision } from '../../utils/scoreCalculator';

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
  const [scorecards, setScorecards] = React.useState<IGoNoGoScorecard[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [versions, setVersions] = React.useState<IScorecardVersion[]>([]);
  const [activeScorecard, setActiveScorecard] = React.useState<IGoNoGoScorecard | null>(null);

  const fetchScorecards = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getScorecards();
      setScorecards(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scorecards');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const getScorecardByLeadId = React.useCallback(async (leadId: number) => {
    const sc = await dataService.getScorecardByLeadId(leadId);
    if (sc) setActiveScorecard(sc);
    return sc;
  }, [dataService]);

  const createScorecard = React.useCallback(async (data: Partial<IGoNoGoScorecard>) => {
    const scorecard = await dataService.createScorecard(data);
    setScorecards(prev => [...prev, scorecard]);
    setActiveScorecard(scorecard);
    return scorecard;
  }, [dataService]);

  const updateScorecard = React.useCallback(async (id: number, data: Partial<IGoNoGoScorecard>) => {
    const updated = await dataService.updateScorecard(id, data);
    setScorecards(prev => prev.map(s => s.id === id ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService]);

  const submitDecision = React.useCallback(async (scorecardId: number, decision: GoNoGoDecision, projectCode?: string) => {
    await dataService.submitGoNoGoDecision(scorecardId, decision, projectCode);
    await fetchScorecards();
  }, [dataService, fetchScorecards]);

  // --- Phase 16: Workflow methods ---

  const submitScorecard = React.useCallback(async (scorecardId: number, approverOverride?: IPersonAssignment) => {
    const updated = await dataService.submitScorecard(scorecardId, currentUser?.email ?? 'unknown', approverOverride);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService, currentUser]);

  const respondToSubmission = React.useCallback(async (scorecardId: number, approved: boolean, comment: string) => {
    const updated = await dataService.respondToScorecardSubmission(scorecardId, approved, comment);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService]);

  const enterCommitteeScores = React.useCallback(async (scorecardId: number, scores: Record<string, number>) => {
    const updated = await dataService.enterCommitteeScores(scorecardId, scores, currentUser?.email ?? 'unknown');
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService, currentUser]);

  const computeRecommendation = React.useCallback((committeeTotal: number): IRecommendation => {
    return getRecommendedDecision(committeeTotal);
  }, []);

  const recordDecision = React.useCallback(async (scorecardId: number, decision: GoNoGoDecision, conditions?: string) => {
    const updated = await dataService.recordFinalDecision(scorecardId, decision, conditions, currentUser?.email);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService, currentUser]);

  // --- Phase 22: Reject / Archive ---

  const rejectScorecard = React.useCallback(async (scorecardId: number, reason: string) => {
    const updated = await dataService.rejectScorecard(scorecardId, reason);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService]);

  const archiveScorecard = React.useCallback(async (scorecardId: number) => {
    const updated = await dataService.archiveScorecard(scorecardId, currentUser?.displayName ?? 'Unknown');
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService, currentUser]);

  const unlockScorecard = React.useCallback(async (scorecardId: number, reason: string) => {
    const updated = await dataService.unlockScorecard(scorecardId, reason);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService]);

  const relockScorecard = React.useCallback(async (scorecardId: number, startNewCycle: boolean) => {
    const updated = await dataService.relockScorecard(scorecardId, startNewCycle);
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s));
    setActiveScorecard(updated);
    return updated;
  }, [dataService]);

  const loadVersions = React.useCallback(async (scorecardId: number) => {
    const v = await dataService.getScorecardVersions(scorecardId);
    setVersions(v);
  }, [dataService]);

  // --- Computed status ---

  const scorecardStatus = activeScorecard?.scorecardStatus ?? null;
  const isLocked = activeScorecard?.isLocked ?? false;
  const currentVersion = activeScorecard?.currentVersion ?? 1;

  const canEdit = React.useMemo(() => {
    if (!activeScorecard) return true; // New scorecard
    const status = activeScorecard.scorecardStatus;
    return (
      status === ScorecardStatus.BDDraft ||
      status === ScorecardStatus.DirectorReturnedForRevision ||
      status === ScorecardStatus.CommitteeReturnedForRevision ||
      status === ScorecardStatus.Unlocked
    );
  }, [activeScorecard]);

  const canSubmit = React.useMemo(() => {
    if (!activeScorecard) return false;
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

  // Alias for backward compatibility
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
