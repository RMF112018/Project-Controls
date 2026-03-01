/**
 * Phase 2 (GNG Plan) — Go/No-Go Scorecard Detail Page.
 *
 * Scoring form with project header summary, 19-criteria scoring table,
 * strategy/decision fields, commentary/resources, and workflow actions.
 *
 * Consumes Phase 1 hooks:
 *   useGoNoGoEvaluation → loads scorecard by lead ID
 *   useGoNoGoMutation   → updateScore, createScorecard, submitForReview, recordDecision
 *   useCalculateGoNoGoTotals → memoized totals, tiers, colors, recommendation
 *
 * Auto-save: debounced 300ms score updates with optimistic feedback.
 * Performance: useDeferredValue on totals keeps score entry responsive.
 */
import * as React from 'react';
import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Spinner,
  Textarea,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { PERMISSIONS, type IGoNoGoScorecard, ScorecardStatus, GoNoGoDecision, RoleName } from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { useParams, useNavigate } from '@router';
import {
  useGoNoGoEvaluation,
  useGoNoGoLeadData,
  useGoNoGoComments,
  useGoNoGoNotes,
  useGoNoGoAuditLog,
  useGoNoGoVersions,
} from '../../../tanstack/query/queryOptions/gonogoQueryOptions';
import {
  useGoNoGoMutation,
  useCalculateGoNoGoTotals,
  useGoNoGoCommentMutations,
  useGoNoGoNoteMutation,
} from '../../../tanstack/query/mutations/useGoNoGoMutation';
import { PageHeader } from '../../shared/PageHeader';
import { ScoreSummaryHeader } from '../../shared/ScoreSummaryHeader';
import { ScoringTable } from '../../shared/ScoringTable';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcField } from '../../shared/HbcField';
import { ProjectHeaderInfo } from '../../shared/ProjectHeaderInfo';
import { ExportButtons } from '../../shared/ExportButtons';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { ScorecardNotePanel } from '../../shared/ScorecardNotePanel';
import { ScorecardAuditLog } from '../../shared/ScorecardAuditLog';
import { ConflictDialog } from '../../shared/ConflictDialog';
import { useConflictDetection } from '../../hooks/useConflictDetection';
import { useWorkflowMachine } from '../../hooks/useWorkflowMachine';
import { useWorkflowTransition } from '../../hooks/useWorkflowTransition';
import { useHbcOptimisticMutation } from '../../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../../tanstack/query/mutations/optimisticMutationFlags';

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: 'grid',
    rowGap: '16px',
    ...shorthands.padding('16px', '0'),
  },
  backButton: {
    justifySelf: 'start',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  skeletonContainer: {
    display: 'grid',
    rowGap: '16px',
    ...shorthands.padding('16px', '0'),
  },
});

// ── Workflow helpers (shared with GoNoGoScorecard.tsx) ──────────────────

const EVENT_LABELS: Record<string, string> = {
  SUBMIT_FOR_REVIEW: 'Submit for Review',
  DIRECTOR_APPROVE: 'Director Approve',
  DIRECTOR_RETURN: 'Director Return',
  RESUBMIT_AFTER_DIRECTOR: 'Resubmit (Director)',
  COMMITTEE_APPROVE: 'Committee Approve',
  COMMITTEE_RETURN: 'Committee Return',
  COMMITTEE_REJECT: 'Committee Reject',
  DECIDE_NOGO: 'Decide No-Go',
  RESUBMIT_AFTER_COMMITTEE: 'Resubmit (Committee)',
  LOCK: 'Lock',
  UNLOCK: 'Unlock',
  RELOCK: 'Relock',
};

function getActorRole(userRoles: string[]): RoleName {
  const firstMatch = userRoles.find((role) => Object.values(RoleName).includes(role as RoleName));
  return (firstMatch as RoleName) ?? RoleName.Leadership;
}

// ── Component ──────────────────────────────────────────────────────────

export const GoNoGoScorecardDetail: React.FC = React.memo(() => {
  const styles = useStyles();
  const { hasPermission, currentUser, dataService, selectedProject } = useAppContext();
  const navigate = useNavigate();
  const params = useParams<{ leadId: string }>();
  const leadId = Number(params.leadId);

  // ── Data hooks ──────────────────────────────────────────────────────

  const { scorecard, isLoading, error, refetch } = useGoNoGoEvaluation(leadId);
  const { lead } = useGoNoGoLeadData(leadId);
  const {
    updateScore,
    createScorecard,
    isUpdatingScore,
    isCreating,
    isMutating,
  } = useGoNoGoMutation({ leadId });

  // ── Totals (deferred for responsiveness) ────────────────────────────

  const scores = scorecard?.scores ?? {};
  const totals = useCalculateGoNoGoTotals(scores);
  const deferredTotals = React.useDeferredValue(totals);

  // ── Permissions ─────────────────────────────────────────────────────

  const canEditOriginator = hasPermission(PERMISSIONS.GONOGO_SCORE_ORIGINATOR);
  const canEditCommittee = hasPermission(PERMISSIONS.GONOGO_SCORE_COMMITTEE);

  // ── Phase 3: Collaboration data hooks ─────────────────────────────

  const scorecardId = scorecard?.id ?? 0;
  const comments = useGoNoGoComments(scorecardId);
  const notes = useGoNoGoNotes(scorecardId);
  const auditLog = useGoNoGoAuditLog(scorecardId);
  const versions = useGoNoGoVersions(scorecardId);

  // ── Phase 3: Collaboration mutation hooks ─────────────────────────

  const { addComment, editComment, deleteComment } = useGoNoGoCommentMutations(scorecardId);
  const { addNote } = useGoNoGoNoteMutation(scorecardId);

  // ── Phase 3: Conflict detection ───────────────────────────────────

  const conflictState = useConflictDetection(scorecard, refetch);

  // ── Debounced auto-save ─────────────────────────────────────────────

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleScoreChange = React.useCallback(
    (criterionId: number, column: 'originator' | 'committee', value: number) => {
      if (!scorecard) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        conflictState.wrapMutation(() =>
          updateScore(scorecard.id, criterionId, column, value),
        ).catch(() => {
          // Error handled by mutation's onError — toast notification
          // Or conflict detected — dialog shown by useConflictDetection
        });
      }, 300);
    },
    [scorecard, updateScore, conflictState],
  );

  // ── Workflow machine ────────────────────────────────────────────────

  const workflowInput = React.useMemo(() => ({
    scorecardId: scorecard?.id ?? 0,
    projectCode: scorecard?.ProjectCode ?? selectedProject?.projectCode ?? '',
    currentStatus: scorecard?.scorecardStatus ?? ScorecardStatus.BDDraft,
    actorRole: getActorRole(currentUser?.roles ?? []),
    userPermissions: Array.from(currentUser?.permissions ?? new Set<string>()),
  }), [scorecard?.id, scorecard?.ProjectCode, scorecard?.scorecardStatus, currentUser?.roles, currentUser?.permissions, selectedProject?.projectCode]);

  const workflow = useWorkflowMachine({
    machineType: 'goNoGo',
    enabled: !!scorecard,
    input: workflowInput,
  });

  const workflowMutation = useHbcOptimisticMutation<IGoNoGoScorecard, { eventType: string }, unknown>({
    method: 'submitScorecard',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.workflows,
    mutationFn: async ({ eventType }) => {
      if (!scorecard) throw new Error('No scorecard');
      const actorName = currentUser?.email ?? 'system';
      switch (eventType) {
        case 'SUBMIT_FOR_REVIEW':
        case 'RESUBMIT_AFTER_DIRECTOR':
        case 'RESUBMIT_AFTER_COMMITTEE':
          return dataService.submitScorecard(scorecard.id, actorName);
        case 'DIRECTOR_APPROVE':
          return dataService.respondToScorecardSubmission(scorecard.id, true, 'Approved');
        case 'DIRECTOR_RETURN':
          return dataService.respondToScorecardSubmission(scorecard.id, false, 'Returned');
        case 'COMMITTEE_APPROVE':
          return dataService.recordFinalDecision(scorecard.id, GoNoGoDecision.Go, 'Committee approved', actorName);
        case 'COMMITTEE_REJECT':
          return dataService.rejectScorecard(scorecard.id, 'Rejected by committee');
        case 'DECIDE_NOGO':
          return dataService.recordFinalDecision(scorecard.id, GoNoGoDecision.NoGo, 'No-Go decision', actorName);
        case 'LOCK':
        case 'RELOCK':
          return dataService.relockScorecard(scorecard.id, false);
        case 'UNLOCK':
          return dataService.unlockScorecard(scorecard.id, 'Unlock requested');
        case 'COMMITTEE_RETURN':
          return dataService.updateScorecard(scorecard.id, { scorecardStatus: ScorecardStatus.CommitteeReturnedForRevision });
        default:
          return dataService.updateScorecard(scorecard.id, {});
      }
    },
    onSettledEffects: async () => {
      refetch();
    },
  });

  const transition = useWorkflowTransition({
    workflow,
    mutation: workflowMutation,
  });

  const runWorkflowAction = React.useCallback(async (eventType: string): Promise<void> => {
    if (!scorecard) return;
    const actorRole = getActorRole(currentUser?.roles ?? []);
    await transition.transition(
      eventType,
      { eventType },
      { actorRole, reason: 'Workflow UI action' },
    );
  }, [scorecard, currentUser?.roles, transition]);

  // ── Create scorecard handler ────────────────────────────────────────

  const handleCreateScorecard = React.useCallback(async () => {
    await createScorecard({
      LeadID: leadId,
      ProjectCode: selectedProject?.projectCode,
      scores: {},
      scorecardStatus: ScorecardStatus.BDDraft,
      currentVersion: 1,
      isLocked: false,
      approvalCycles: [],
      versions: [],
    });
    refetch();
  }, [createScorecard, leadId, selectedProject?.projectCode, refetch]);

  // ── Navigation ──────────────────────────────────────────────────────

  const handleBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ── Loading state ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.skeletonContainer}>
        <PageHeader title="Go / No-Go Scorecard" />
        <HbcSkeleton variant="form" aria-label="Loading scorecard" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────

  if (error) {
    return (
      <div className={styles.container}>
        <PageHeader title="Go / No-Go Scorecard" />
        <MessageBar intent="error">
          <MessageBarBody>Failed to load scorecard: {error.message}</MessageBarBody>
        </MessageBar>
        <Button appearance="secondary" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // ── No scorecard — offer to create ──────────────────────────────────

  if (!scorecard) {
    return (
      <div className={styles.container}>
        <Button
          className={styles.backButton}
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={handleBack}
        >
          Back
        </Button>
        <PageHeader title="Go / No-Go Scorecard" subtitle={`Lead #${leadId}`} />
        <MessageBar intent="info">
          <MessageBarBody>No scorecard exists for this lead.</MessageBarBody>
        </MessageBar>
        {canEditOriginator && (
          <Button
            appearance="primary"
            onClick={() => void handleCreateScorecard()}
            disabled={isCreating}
          >
            {isCreating ? <><Spinner size="tiny" /> Creating...</> : 'Create Scorecard'}
          </Button>
        )}
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────

  return (
    <div className={styles.container} id="gonogo-print-area">
      {/* Back navigation */}
      <Button
        className={styles.backButton}
        appearance="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={handleBack}
        data-print-hide
      >
        Back to Scorecards
      </Button>

      {/* Export */}
      <div data-print-hide>
        <ExportButtons
          pdfElementId="gonogo-print-area"
          filename={`GoNoGo-${scorecard.ProjectCode ?? leadId}`}
          title={`Go/No-Go Scorecard \u2014 ${scorecard.ProjectCode ?? `Lead #${leadId}`}`}
        />
      </div>

      {/* Page header */}
      <PageHeader
        title="Go / No-Go Scorecard"
        subtitle={scorecard.ProjectCode ? `${scorecard.ProjectCode} — Lead #${leadId}` : `Lead #${leadId}`}
      />

      {/* Score Summary KPIs */}
      <ScoreSummaryHeader
        scorecard={scorecard}
        totals={deferredTotals}
        projectName={selectedProject?.projectName}
        clientName={lead?.ClientName}
      />

      {/* Project Information (auto-filled from lead) */}
      <ProjectHeaderInfo
        lead={lead}
        scorecard={scorecard}
        projectName={selectedProject?.projectName}
      />

      {/* Workflow actions */}
      {workflow.isReady && workflow.allowedEvents.length > 0 && (
        <div className={styles.actions} data-print-hide>
          {workflow.allowedEvents.map((eventType) => (
            <Button
              key={eventType}
              size="small"
              appearance="secondary"
              disabled={!workflow.can(eventType) || transition.isTransitioning}
              onClick={() => void runWorkflowAction(eventType)}
              data-testid={`gonogo-detail-action-${eventType}`}
            >
              {EVENT_LABELS[eventType] ?? eventType}
            </Button>
          ))}
          {transition.isTransitioning && <Spinner size="tiny" />}
        </div>
      )}

      {workflow.error && (
        <MessageBar intent="warning">
          <MessageBarBody>Workflow machine unavailable: {workflow.error.message}</MessageBarBody>
        </MessageBar>
      )}

      {/* Auto-save indicator */}
      {isUpdatingScore && (
        <MessageBar intent="info">
          <MessageBarBody>
            <Spinner size="tiny" style={{ marginRight: '8px' }} /> Saving score...
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Scoring Table */}
      <CollapsibleSection title="Scoring Criteria" defaultExpanded>
        <ScoringTable
          scores={scores}
          onScoreChange={handleScoreChange}
          canEditOriginator={canEditOriginator && !scorecard.isLocked}
          canEditCommittee={canEditCommittee && !scorecard.isLocked}
          isUpdating={isUpdatingScore}
          originatorTotal={deferredTotals.originatorTotal}
          committeeTotal={deferredTotals.committeeTotal}
          originatorColor={deferredTotals.originatorColor}
          committeeColor={deferredTotals.committeeColor}
          criterionComments={comments.data}
          criterionMeta={scorecard.criterionMeta}
          currentUserEmail={currentUser?.email}
          onAddComment={addComment}
          onEditComment={editComment}
          onDeleteComment={deleteComment}
          canComment={canEditOriginator || canEditCommittee}
          isLocked={scorecard.isLocked}
        />
      </CollapsibleSection>

      {/* Strategy & Decision */}
      <CollapsibleSection title="Strategy & Decision" defaultExpanded={false}>
        <div className={styles.formGrid}>
          <HbcField label="Win Strategy">
            <Textarea
              value={scorecard.WinStrategy ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Win Strategy"
            />
          </HbcField>
          <HbcField label="HB Differentiators">
            <Textarea
              value={scorecard.HBDifferentiators ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="HB Differentiators"
            />
          </HbcField>
          <HbcField label="Decision Making Process">
            <Textarea
              value={scorecard.DecisionMakingProcess ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Decision Making Process"
            />
          </HbcField>
          <HbcField label="Strategic Pursuit">
            <Textarea
              value={scorecard.StrategicPursuit ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Strategic Pursuit"
            />
          </HbcField>
          <HbcField label="Decision Maker / Advocate">
            <Textarea
              value={scorecard.DecisionMakerAdvocate ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={1}
              aria-label="Decision Maker / Advocate"
            />
          </HbcField>
        </div>
      </CollapsibleSection>

      {/* Commentary & Resources */}
      <CollapsibleSection title="Commentary & Resources" defaultExpanded={false}>
        <div className={styles.formGrid}>
          <HbcField label="Originator Comments">
            <Textarea
              value={scorecard.OriginatorComments ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Originator Comments"
            />
          </HbcField>
          <HbcField label="Committee Comments">
            <Textarea
              value={scorecard.CommitteeComments ?? ''}
              disabled={scorecard.isLocked || !canEditCommittee}
              resize="vertical"
              rows={3}
              aria-label="Committee Comments"
            />
          </HbcField>
          <HbcField label="Proposal / Marketing Comments">
            <Textarea
              value={scorecard.ProposalMarketingComments ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Proposal Marketing Comments"
            />
          </HbcField>
          <HbcField label="Estimating Comments">
            <Textarea
              value={scorecard.EstimatingComments ?? ''}
              disabled={scorecard.isLocked || !canEditOriginator}
              resize="vertical"
              rows={3}
              aria-label="Estimating Comments"
            />
          </HbcField>
        </div>
      </CollapsibleSection>

      {/* Phase 3: Discussion Notes */}
      <ScorecardNotePanel
        scorecardId={scorecard.id}
        notes={notes.data ?? []}
        currentUserEmail={currentUser?.email ?? ''}
        onAddNote={addNote}
        canAddNote={canEditOriginator || canEditCommittee}
        isLocked={scorecard.isLocked}
      />

      {/* Phase 3: Audit / Change History */}
      <ScorecardAuditLog
        scorecardId={scorecard.id}
        auditEntries={auditLog.data ?? []}
        versions={versions.data ?? []}
        isLoading={auditLog.isLoading || versions.isLoading}
      />

      {/* Phase 3: Conflict resolution dialog */}
      <ConflictDialog
        open={conflictState.isConflicted}
        lastModifiedBy={conflictState.serverModifiedBy}
        lastModifiedDate={conflictState.serverModifiedDate}
        onOverwrite={conflictState.confirmOverwrite}
        onRefresh={conflictState.confirmRefresh}
        onCancel={conflictState.dismiss}
      />
    </div>
  );
});
GoNoGoScorecardDetail.displayName = 'GoNoGoScorecardDetail';
