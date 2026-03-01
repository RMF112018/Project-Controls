/**
 * Phase 1 (GNG Plan) — Shared composition hook for all Go/No-Go Scorecard mutations.
 *
 * Centralizes score entry, scorecard creation, and workflow transitions
 * behind useHbcOptimisticMutation with feature-flag gating.
 *
 * Invalidation chain:
 *   Score update    → qk.gonogo.byLeadId (optimistic) + qk.gonogo.base (settled)
 *   Create          → qk.gonogo.base
 *   Workflow action → qk.gonogo.base
 *
 * Pattern follows useEstimatingMutation.ts composition hook.
 */
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IGoNoGoScorecard, IScorecardCriterionComment, IScorecardNote } from '@hbc/sp-services';
import {
  AuditAction,
  EntityType,
  GoNoGoDecision,
  calculateTotalScore,
  getScoreTier,
  getScoreTierLabel,
  getScoreTierColor,
  isScorecardComplete,
  getCompletionPercentage,
  getRecommendedDecision,
  validateScore,
} from '@hbc/sp-services';
import { useAppContext } from '../../../components/contexts/AppContext';
import { useQueryScope } from '../useQueryScope';
import { qk } from '../queryKeys';
import { OPTIMISTIC_MUTATION_FLAGS } from './optimisticMutationFlags';
import { useHbcOptimisticMutation } from './useHbcOptimisticMutation';
import { mergeScorecardScoresOptimistic, appendCommentOptimistic, removeCommentOptimistic } from './optimisticPatchers';

// ── Types ──────────────────────────────────────────────────────────────

export interface IUseGoNoGoMutationOptions {
  /** Scopes score cache keys to this lead. */
  leadId: number;
}

export interface IUseGoNoGoMutationResult {
  /** Update a single criterion score (optimistic). */
  updateScore: (
    scorecardId: number,
    criterionId: number,
    column: 'originator' | 'committee',
    value: number,
  ) => Promise<IGoNoGoScorecard>;
  /** Create a new scorecard for a lead. */
  createScorecard: (data: Partial<IGoNoGoScorecard>) => Promise<IGoNoGoScorecard>;
  /** Submit scorecard for director review. */
  submitForReview: (scorecardId: number) => Promise<IGoNoGoScorecard>;
  /** Enter committee scores in bulk. */
  enterCommitteeScores: (
    scorecardId: number,
    scores: Record<string, number>,
  ) => Promise<IGoNoGoScorecard>;
  /** Record final Go/NoGo/ConditionalGo decision. */
  recordDecision: (
    scorecardId: number,
    decision: GoNoGoDecision,
    conditions?: string,
  ) => Promise<IGoNoGoScorecard>;
  // Status flags
  isUpdatingScore: boolean;
  isCreating: boolean;
  isMutating: boolean;
}

/** Return type for useCalculateGoNoGoTotals. */
export interface IGoNoGoTotals {
  originatorTotal: number;
  committeeTotal: number;
  difference: number;
  originatorTier: 'high' | 'mid' | 'low';
  committeeTier: 'high' | 'mid' | 'low';
  originatorColor: string;
  committeeColor: string;
  originatorLabel: string;
  committeeLabel: string;
  isOriginatorComplete: boolean;
  isCommitteeComplete: boolean;
  originatorCompletionPct: number;
  committeeCompletionPct: number;
  recommendedDecision?: {
    decision: GoNoGoDecision;
    confidence: 'Strong' | 'Moderate' | 'Weak';
    reasoning: string;
  };
}

// ── Composition Hook ───────────────────────────────────────────────────

export function useGoNoGoMutation(
  options: IUseGoNoGoMutationOptions,
): IUseGoNoGoMutationResult {
  const { dataService, currentUser } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const { leadId } = options;
  const domainFlag = OPTIMISTIC_MUTATION_FLAGS.gonogo;

  // ── Invalidation helpers ────────────────────────────────────────────

  const invalidateGoNogoDomain = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.gonogo.base(scope) });
  }, [queryClient, scope]);

  // ── Score update (optimistic) ───────────────────────────────────────

  const updateScoreMutation = useHbcOptimisticMutation<
    IGoNoGoScorecard,
    { scorecardId: number; criterionId: number; column: 'originator' | 'committee'; value: number },
    IGoNoGoScorecard | null | undefined
  >({
    method: 'updateScorecard',
    domainFlag,
    mutationFn: async ({ scorecardId, criterionId, column, value }) => {
      // Validate the score value against the criterion's allowed values
      if (!validateScore(criterionId, value)) {
        throw new Error(`Invalid score value ${value} for criterion ${criterionId}`);
      }

      // Read current scorecard from cache to merge the single score
      const cached = queryClient.getQueryData<IGoNoGoScorecard | null>(
        qk.gonogo.byLeadId(scope, leadId),
      );
      const currentScores = cached?.scores ?? {};

      const updatedScores: IGoNoGoScorecard['scores'] = {
        ...currentScores,
        [criterionId]: {
          ...currentScores[criterionId],
          [column]: value,
        },
      };

      return dataService.updateScorecard(scorecardId, {
        scores: updatedScores,
        TotalScore_Orig: calculateTotalScore(updatedScores, 'originator'),
        TotalScore_Cmte: calculateTotalScore(updatedScores, 'committee'),
      });
    },
    getStateKey: () => qk.gonogo.byLeadId(scope, leadId),
    applyOptimistic: (previous, { criterionId, column, value }) => {
      if (!previous) return previous;
      return mergeScorecardScoresOptimistic(previous, criterionId, column, value);
    },
    onSettledEffects: invalidateGoNogoDomain,
  });

  // ── Create scorecard ────────────────────────────────────────────────

  const createScorecardMutation = useHbcOptimisticMutation<
    IGoNoGoScorecard,
    Partial<IGoNoGoScorecard>,
    unknown
  >({
    method: 'createScorecard',
    domainFlag,
    mutationFn: (data) => dataService.createScorecard(data),
    onSettledEffects: invalidateGoNogoDomain,
  });

  // ── Workflow: submit for review ─────────────────────────────────────

  const submitForReviewMutation = useHbcOptimisticMutation<
    IGoNoGoScorecard,
    number,
    unknown
  >({
    method: 'submitScorecard',
    domainFlag,
    mutationFn: (scorecardId) =>
      dataService.submitScorecard(scorecardId, currentUser?.email ?? 'system'),
    onSettledEffects: invalidateGoNogoDomain,
  });

  // ── Workflow: enter committee scores ────────────────────────────────

  const enterCommitteeScoresMutation = useHbcOptimisticMutation<
    IGoNoGoScorecard,
    { scorecardId: number; scores: Record<string, number> },
    unknown
  >({
    method: 'submitScorecard',
    domainFlag,
    mutationFn: ({ scorecardId, scores }) =>
      dataService.enterCommitteeScores(scorecardId, scores, currentUser?.email ?? 'system'),
    onSettledEffects: invalidateGoNogoDomain,
  });

  // ── Workflow: record final decision ─────────────────────────────────

  const recordDecisionMutation = useHbcOptimisticMutation<
    IGoNoGoScorecard,
    { scorecardId: number; decision: GoNoGoDecision; conditions?: string },
    unknown
  >({
    method: 'recordFinalDecision',
    domainFlag,
    mutationFn: ({ scorecardId, decision, conditions }) =>
      dataService.recordFinalDecision(scorecardId, decision, conditions, currentUser?.email ?? 'system'),
    onSettledEffects: invalidateGoNogoDomain,
  });

  // ── Stable callback wrappers ────────────────────────────────────────

  const updateScore = React.useCallback(
    (scorecardId: number, criterionId: number, column: 'originator' | 'committee', value: number) =>
      updateScoreMutation.mutateAsync({ scorecardId, criterionId, column, value }),
    [updateScoreMutation],
  );

  const createScorecard = React.useCallback(
    (data: Partial<IGoNoGoScorecard>) => createScorecardMutation.mutateAsync(data),
    [createScorecardMutation],
  );

  const submitForReview = React.useCallback(
    (scorecardId: number) => submitForReviewMutation.mutateAsync(scorecardId),
    [submitForReviewMutation],
  );

  const enterCommitteeScoresCb = React.useCallback(
    (scorecardId: number, scores: Record<string, number>) =>
      enterCommitteeScoresMutation.mutateAsync({ scorecardId, scores }),
    [enterCommitteeScoresMutation],
  );

  const recordDecision = React.useCallback(
    (scorecardId: number, decision: GoNoGoDecision, conditions?: string) =>
      recordDecisionMutation.mutateAsync({ scorecardId, decision, conditions }),
    [recordDecisionMutation],
  );

  // ── Status aggregation ──────────────────────────────────────────────

  const isUpdatingScore = updateScoreMutation.isPending;
  const isCreating = createScorecardMutation.isPending;
  const isMutating =
    isUpdatingScore ||
    isCreating ||
    submitForReviewMutation.isPending ||
    enterCommitteeScoresMutation.isPending ||
    recordDecisionMutation.isPending;

  return {
    updateScore,
    createScorecard,
    submitForReview,
    enterCommitteeScores: enterCommitteeScoresCb,
    recordDecision,
    isUpdatingScore,
    isCreating,
    isMutating,
  };
}

// ── Convenience Hook: useUpdateGoNoGoScore ─────────────────────────────

export interface IUseUpdateGoNoGoScoreResult {
  /** Update a single criterion score for the active scorecard. */
  updateScore: (
    scorecardId: number,
    criterionId: number,
    column: 'originator' | 'committee',
    value: number,
  ) => Promise<IGoNoGoScorecard>;
  isPending: boolean;
}

/**
 * Thin wrapper exposing only the score-update mutation from useGoNoGoMutation.
 * Requires a leadId for cache-key scoping.
 */
export function useUpdateGoNoGoScore(leadId: number): IUseUpdateGoNoGoScoreResult {
  const { updateScore, isUpdatingScore } = useGoNoGoMutation({ leadId });
  return { updateScore, isPending: isUpdatingScore };
}

// ── Convenience Hook: useCalculateGoNoGoTotals ─────────────────────────

/**
 * Pure memoized calculation hook — no API call.
 * Computes originator/committee totals, difference, tier colors, completion
 * percentages, and recommended decision from the scorecard's scores object.
 *
 * All math delegates to scoreCalculator.ts from @hbc/sp-services.
 */
export function useCalculateGoNoGoTotals(
  scores: IGoNoGoScorecard['scores'],
): IGoNoGoTotals {
  return React.useMemo(() => {
    const originatorTotal = calculateTotalScore(scores, 'originator');
    const committeeTotal = calculateTotalScore(scores, 'committee');
    const difference = committeeTotal - originatorTotal;

    return {
      originatorTotal,
      committeeTotal,
      difference,
      originatorTier: getScoreTier(originatorTotal),
      committeeTier: getScoreTier(committeeTotal),
      originatorColor: getScoreTierColor(originatorTotal),
      committeeColor: getScoreTierColor(committeeTotal),
      originatorLabel: getScoreTierLabel(originatorTotal),
      committeeLabel: getScoreTierLabel(committeeTotal),
      isOriginatorComplete: isScorecardComplete(scores, 'originator'),
      isCommitteeComplete: isScorecardComplete(scores, 'committee'),
      originatorCompletionPct: getCompletionPercentage(scores, 'originator'),
      committeeCompletionPct: getCompletionPercentage(scores, 'committee'),
      recommendedDecision: committeeTotal > 0
        ? getRecommendedDecision(committeeTotal)
        : undefined,
    };
  }, [scores]);
}

// ── Phase 3: Comment Mutations ──────────────────────────────────────────

export interface IUseGoNoGoCommentMutationsResult {
  addComment: (criterionId: number, text: string) => Promise<IScorecardCriterionComment>;
  editComment: (commentId: number, text: string) => Promise<IScorecardCriterionComment>;
  deleteComment: (commentId: number) => Promise<void>;
  isAdding: boolean;
  isEditing: boolean;
  isDeleting: boolean;
}

export function useGoNoGoCommentMutations(scorecardId: number): IUseGoNoGoCommentMutationsResult {
  const { dataService, currentUser } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const domainFlag = OPTIMISTIC_MUTATION_FLAGS.gonogo;

  const invalidateComments = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.gonogo.comments(scope, scorecardId) });
    await queryClient.invalidateQueries({ queryKey: qk.gonogo.auditLog(scope, scorecardId) });
  }, [queryClient, scope, scorecardId]);

  const addCommentMutation = useHbcOptimisticMutation<
    IScorecardCriterionComment,
    { criterionId: number; text: string },
    IScorecardCriterionComment[]
  >({
    method: 'addScorecardComment',
    domainFlag,
    mutationFn: ({ criterionId, text }) =>
      dataService.addScorecardComment(
        scorecardId,
        criterionId,
        text,
        currentUser?.email ?? '',
        currentUser?.displayName ?? '',
      ),
    getStateKey: () => qk.gonogo.comments(scope, scorecardId),
    applyOptimistic: (prev, { criterionId, text }) =>
      appendCommentOptimistic(prev ?? [], {
        id: -Date.now(),
        scorecardId,
        criterionId,
        authorEmail: currentUser?.email ?? '',
        authorName: currentUser?.displayName ?? '',
        text,
        createdDate: new Date().toISOString(),
      }),
    onSettledEffects: invalidateComments,
  });

  const editCommentMutation = useHbcOptimisticMutation<
    IScorecardCriterionComment,
    { commentId: number; text: string },
    IScorecardCriterionComment[]
  >({
    method: 'updateScorecardComment',
    domainFlag,
    mutationFn: ({ commentId, text }) => dataService.updateScorecardComment(commentId, text),
    getStateKey: () => qk.gonogo.comments(scope, scorecardId),
    applyOptimistic: (prev, { commentId, text }) =>
      (prev ?? []).map((c) =>
        c.id === commentId ? { ...c, text, editedDate: new Date().toISOString() } : c,
      ),
    onSettledEffects: invalidateComments,
  });

  const deleteCommentMutation = useHbcOptimisticMutation<
    void,
    { commentId: number },
    IScorecardCriterionComment[]
  >({
    method: 'deleteScorecardComment',
    domainFlag,
    mutationFn: ({ commentId }) => dataService.deleteScorecardComment(commentId),
    getStateKey: () => qk.gonogo.comments(scope, scorecardId),
    applyOptimistic: (prev, { commentId }) => removeCommentOptimistic(prev ?? [], commentId),
    onSettledEffects: invalidateComments,
  });

  const addComment = React.useCallback(
    (criterionId: number, text: string) =>
      addCommentMutation.mutateAsync({ criterionId, text }),
    [addCommentMutation],
  );

  const editComment = React.useCallback(
    (commentId: number, text: string) =>
      editCommentMutation.mutateAsync({ commentId, text }),
    [editCommentMutation],
  );

  const deleteComment = React.useCallback(
    (commentId: number) =>
      deleteCommentMutation.mutateAsync({ commentId }),
    [deleteCommentMutation],
  );

  return {
    addComment,
    editComment,
    deleteComment,
    isAdding: addCommentMutation.isPending,
    isEditing: editCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
  };
}

// ── Phase 3: Note Mutations ─────────────────────────────────────────────

export interface IUseGoNoGoNoteMutationResult {
  addNote: (text: string, mentions: string[]) => Promise<IScorecardNote>;
  isAdding: boolean;
}

export function useGoNoGoNoteMutation(scorecardId: number): IUseGoNoGoNoteMutationResult {
  const { dataService, currentUser } = useAppContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const domainFlag = OPTIMISTIC_MUTATION_FLAGS.gonogo;

  const addNoteMutation = useHbcOptimisticMutation<
    IScorecardNote,
    { text: string; mentions: string[] },
    IScorecardNote[]
  >({
    method: 'addScorecardNote',
    domainFlag,
    mutationFn: ({ text, mentions }) =>
      dataService.addScorecardNote(
        scorecardId,
        text,
        currentUser?.email ?? '',
        currentUser?.displayName ?? '',
        mentions,
      ),
    getStateKey: () => qk.gonogo.notes(scope, scorecardId),
    applyOptimistic: (prev, { text, mentions }) => [
      ...(prev ?? []),
      {
        id: -Date.now(),
        scorecardId,
        authorEmail: currentUser?.email ?? '',
        authorName: currentUser?.displayName ?? '',
        text,
        mentions,
        createdDate: new Date().toISOString(),
      },
    ],
    onSuccessEffects: async (data, { mentions }) => {
      if (mentions.length > 0) {
        void dataService.logAudit({
          Action: AuditAction.ScorecardMentionSent,
          EntityType: EntityType.ScorecardNote,
          EntityId: String(scorecardId),
          User: currentUser?.email ?? '',
          Details: `Mentioned ${mentions.join(', ')} in scorecard note`,
        });
      }
    },
    onSettledEffects: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.gonogo.notes(scope, scorecardId) });
      await queryClient.invalidateQueries({ queryKey: qk.gonogo.auditLog(scope, scorecardId) });
    },
  });

  const addNote = React.useCallback(
    (text: string, mentions: string[]) => addNoteMutation.mutateAsync({ text, mentions }),
    [addNoteMutation],
  );

  return {
    addNote,
    isAdding: addNoteMutation.isPending,
  };
}
