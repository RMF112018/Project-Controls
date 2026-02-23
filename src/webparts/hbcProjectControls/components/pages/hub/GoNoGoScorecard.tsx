import * as React from 'react';
import { Button, makeStyles, MessageBar, shorthands, Spinner, tokens } from '@fluentui/react-components';
import { useMutation } from '@tanstack/react-query';
import { GoNoGoDecision, PERMISSIONS, type IGoNoGoScorecard, RoleName, ScorecardStatus } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkflowMachine } from '../../hooks/useWorkflowMachine';
import { useWorkflowTransition } from '../../hooks/useWorkflowTransition';
import { useHbcOptimisticMutation } from '../../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../../tanstack/query/mutations/optimisticMutationFlags';

interface IGoNoGoScorecardProps {
  mode: 'preconstruction' | 'project-hub';
}

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
    display: 'grid',
    rowGap: '12px',
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: 500 as const,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
});

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
  return (firstMatch as RoleName) ?? RoleName.BDRepresentative;
}

function mapStateToStatus(state: string, fallback: ScorecardStatus): ScorecardStatus {
  switch (state) {
    case 'awaitingDirectorReview': return ScorecardStatus.AwaitingDirectorReview;
    case 'directorReturnedForRevision': return ScorecardStatus.DirectorReturnedForRevision;
    case 'awaitingCommitteeScoring': return ScorecardStatus.AwaitingCommitteeScoring;
    case 'committeeReturnedForRevision': return ScorecardStatus.CommitteeReturnedForRevision;
    case 'rejected': return ScorecardStatus.Rejected;
    case 'noGo': return ScorecardStatus.NoGo;
    case 'go': return ScorecardStatus.Go;
    case 'locked': return ScorecardStatus.Locked;
    case 'unlocked': return ScorecardStatus.Unlocked;
    case 'bdDraft':
    default:
      return fallback;
  }
}

export const GoNoGoScorecard: React.FC<IGoNoGoScorecardProps> = ({ mode }) => {
  const styles = useStyles();
  const { dataService, currentUser, isFeatureEnabled, selectedProject } = useAppContext();
  const [scorecards, setScorecards] = React.useState<IGoNoGoScorecard[]>([]);
  const [loading, setLoading] = React.useState(true);

  const workflowEnabled = isFeatureEnabled('WorkflowStateMachine');
  const activeScorecard = React.useMemo(() => {
    if (mode === 'project-hub' && selectedProject?.leadId) {
      return scorecards.find((card) => card.LeadID === selectedProject.leadId) ?? scorecards[0] ?? null;
    }
    return scorecards[0] ?? null;
  }, [mode, selectedProject?.leadId, scorecards]);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    dataService.getScorecards()
      .then((items) => {
        if (!isMounted) return;
        if (mode === 'project-hub' && selectedProject?.leadId) {
          setScorecards(items.filter((item) => item.LeadID === selectedProject.leadId));
          return;
        }
        setScorecards(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setScorecards([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dataService, mode, selectedProject?.leadId]);

  const optimisticMutation = useHbcOptimisticMutation<IGoNoGoScorecard, { eventType: string }, IGoNoGoScorecard[]>({
    method: 'submitScorecard',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.workflows,
    mutationFn: async ({ eventType }) => {
      if (!activeScorecard) {
        throw new Error('No scorecard selected');
      }

      const actorName = currentUser?.email ?? 'system';

      switch (eventType) {
        case 'SUBMIT_FOR_REVIEW':
        case 'RESUBMIT_AFTER_DIRECTOR':
        case 'RESUBMIT_AFTER_COMMITTEE':
          return dataService.submitScorecard(activeScorecard.id, actorName);
        case 'DIRECTOR_APPROVE':
          return dataService.respondToScorecardSubmission(activeScorecard.id, true, 'Approved by workflow machine');
        case 'DIRECTOR_RETURN':
          return dataService.respondToScorecardSubmission(activeScorecard.id, false, 'Returned by workflow machine');
        case 'COMMITTEE_APPROVE':
          return dataService.recordFinalDecision(activeScorecard.id, GoNoGoDecision.Go, 'Workflow machine', actorName);
        case 'COMMITTEE_REJECT':
          return dataService.rejectScorecard(activeScorecard.id, 'Rejected by committee');
        case 'DECIDE_NOGO':
          return dataService.recordFinalDecision(activeScorecard.id, GoNoGoDecision.NoGo, 'Workflow machine', actorName);
        case 'LOCK':
          return dataService.relockScorecard(activeScorecard.id, false);
        case 'UNLOCK':
          return dataService.unlockScorecard(activeScorecard.id, 'Workflow machine unlock');
        case 'RELOCK':
          return dataService.relockScorecard(activeScorecard.id, false);
        case 'COMMITTEE_RETURN':
          return dataService.updateScorecard(activeScorecard.id, { scorecardStatus: ScorecardStatus.CommitteeReturnedForRevision });
        default:
          return dataService.updateScorecard(activeScorecard.id, {});
      }
    },
    getStateKey: () => ['gonogo', 'scorecards'],
    applyOptimistic: (previous) => previous ?? [],
    onSettledEffects: async () => {
      const refreshed = await dataService.getScorecards();
      setScorecards(mode === 'project-hub' && selectedProject?.leadId
        ? refreshed.filter((item) => item.LeadID === selectedProject.leadId)
        : refreshed);
    },
  });

  const fallbackMutation = useMutation<IGoNoGoScorecard, Error, { eventType: string }>({
    mutationFn: async ({ eventType }) => {
      if (!activeScorecard) {
        throw new Error('No scorecard selected');
      }
      if (eventType === 'SUBMIT_FOR_REVIEW') {
        return dataService.submitScorecard(activeScorecard.id, currentUser?.email ?? 'system');
      }
      return dataService.updateScorecard(activeScorecard.id, {});
    },
  });

  const workflowInput = React.useMemo(() => ({
    scorecardId: activeScorecard?.id ?? 0,
    projectCode: activeScorecard?.ProjectCode ?? selectedProject?.projectCode ?? '',
    currentStatus: activeScorecard?.scorecardStatus ?? ScorecardStatus.BDDraft,
    actorRole: getActorRole(currentUser?.roles ?? []),
    userPermissions: Array.from(currentUser?.permissions ?? new Set<string>()),
  }), [activeScorecard?.id, activeScorecard?.ProjectCode, activeScorecard?.scorecardStatus, currentUser?.roles, currentUser?.permissions, selectedProject?.projectCode]);

  const workflow = useWorkflowMachine({
    machineType: 'goNoGo',
    enabled: workflowEnabled && !!activeScorecard,
    input: workflowInput,
  });

  const transition = useWorkflowTransition({
    workflow,
    mutation: optimisticMutation,
  });

  const displayedStatusById = React.useMemo(() => {
    const map = new Map<number, ScorecardStatus>();
    if (workflowEnabled && activeScorecard && workflow.state) {
      map.set(activeScorecard.id, mapStateToStatus(workflow.state, activeScorecard.scorecardStatus));
    }
    return map;
  }, [workflowEnabled, activeScorecard, workflow.state]);

  const columns = React.useMemo((): IHbcDataTableColumn<IGoNoGoScorecard>[] => [
    { key: 'ProjectCode', header: 'Lead', render: (row) => row.ProjectCode || '—' },
    {
      key: 'scorecardStatus',
      header: 'Status',
      render: (row) => {
        const status = displayedStatusById.get(row.id) ?? row.scorecardStatus ?? ScorecardStatus.BDDraft;
        return (
          <span className={styles.statusPill} style={{ backgroundColor: tokens.colorNeutralBackground3 }} data-testid="gonogo-workflow-status">
            {status}
          </span>
        );
      },
    },
    {
      key: 'Decision',
      header: 'Decision',
      render: (row) => row.Decision || 'Pending',
    },
    { key: 'TotalScore_Orig', header: 'Score', render: (row) => row.TotalScore_Orig !== undefined ? String(row.TotalScore_Orig) : '—' },
    { key: 'committeeMeetingDate', header: 'Meeting Date', render: (row) => row.committeeMeetingDate ? new Date(row.committeeMeetingDate).toLocaleDateString() : '—' },
  ], [displayedStatusById, styles.statusPill]);

  const runWorkflowAction = React.useCallback(async (eventType: string): Promise<void> => {
    if (!activeScorecard) return;
    const actorRole = getActorRole(currentUser?.roles ?? []);

    if (!workflowEnabled) {
      await fallbackMutation.mutateAsync({ eventType });
      return;
    }

    await transition.transition(
      eventType,
      { eventType },
      { actorRole, reason: 'Workflow UI action' }
    );
  }, [activeScorecard, currentUser?.roles, fallbackMutation, transition, workflowEnabled]);

  if (mode === 'project-hub' && !selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Go / No-Go Scorecard" />
        <MessageBar>No project selected. Select a project from the sidebar.</MessageBar>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Go / No-Go Scorecards"
        subtitle={mode === 'project-hub' ? `${selectedProject?.projectCode ?? ''} ${selectedProject?.projectName ?? ''}`.trim() : undefined}
      />

      {workflowEnabled && activeScorecard && workflow.isReady && (
        <div className={styles.actions}>
          {workflow.allowedEvents.map((eventType) => (
            <Button
              key={eventType}
              size="small"
              appearance="secondary"
              disabled={!workflow.can(eventType) || transition.isTransitioning}
              onClick={() => void runWorkflowAction(eventType)}
              data-testid={`gonogo-machine-action-${eventType}`}
            >
              {EVENT_LABELS[eventType] ?? eventType}
            </Button>
          ))}
          {transition.isTransitioning && <Spinner size="tiny" />}
        </div>
      )}

      {workflowEnabled && workflow.error && (
        <MessageBar intent="warning">Workflow machine unavailable: {workflow.error.message}</MessageBar>
      )}

      <HbcDataTable
        tableId={mode === 'project-hub' ? 'projecthub-gonogo' : 'precon-gonogo'}
        columns={columns}
        items={scorecards}
        isLoading={loading}
        keyExtractor={(row) => String(row.id)}
      />

      {!workflowEnabled && activeScorecard && (
        <div className={styles.actions}>
          <Button
            size="small"
            appearance="primary"
            disabled={!currentUser?.permissions?.has(PERMISSIONS.GONOGO_SUBMIT)}
            onClick={() => void runWorkflowAction('SUBMIT_FOR_REVIEW')}
            data-testid="gonogo-machine-action-SUBMIT_FOR_REVIEW"
          >
            Submit for Review
          </Button>
        </div>
      )}
    </div>
  );
};
