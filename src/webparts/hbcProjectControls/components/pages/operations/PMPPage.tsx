import * as React from 'react';
import { Button, makeStyles, Spinner, shorthands, tokens } from '@fluentui/react-components';
import { RoleName, type IProjectManagementPlan, type PMPStatus } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkflowMachine } from '../../hooks/useWorkflowMachine';
import { useWorkflowTransition } from '../../hooks/useWorkflowTransition';
import { useHbcOptimisticMutation } from '../../../tanstack/query/mutations/useHbcOptimisticMutation';
import { OPTIMISTIC_MUTATION_FLAGS } from '../../../tanstack/query/mutations/optimisticMutationFlags';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_MAP: Record<string, { color: string; backgroundColor: string }> = {
  Draft: { color: HBC_COLORS.gray500, backgroundColor: HBC_COLORS.gray100 },
  PendingSignatures: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
  PendingApproval: { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
  Approved: { color: HBC_COLORS.success, backgroundColor: HBC_COLORS.successLight },
  Returned: { color: HBC_COLORS.error, backgroundColor: HBC_COLORS.errorLight },
  Closed: { color: HBC_COLORS.gray500, backgroundColor: HBC_COLORS.gray200 },
};

const PMP_EVENT_LABELS: Record<string, string> = {
  SUBMIT_FOR_APPROVAL: 'Submit for Approval',
  APPROVE_STEP: 'Approve Step',
  APPROVE_FINAL: 'Final Approve',
  RETURN_STEP: 'Return',
  RESUBMIT: 'Resubmit',
  BEGIN_SIGNATURES: 'Begin Signatures',
  SIGN: 'Sign',
  SIGN_FINAL: 'Final Signature',
};

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  sectionContent: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    whiteSpace: 'pre-wrap',
  },
  metaRow: {
    display: 'flex',
    ...shorthands.gap('24px'),
    ...shorthands.padding('12px', '0'),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '0'),
    alignItems: 'center',
  },
});

function getActorRole(userRoles: string[]): RoleName {
  const firstMatch = userRoles.find((role) => Object.values(RoleName).includes(role as RoleName));
  return (firstMatch as RoleName) ?? RoleName.Leadership;
}

function mapStateToDisplayStatus(state: string, fallback: PMPStatus): PMPStatus {
  switch (state) {
    case 'draft': return 'Draft';
    case 'pendingApproval': return 'PendingApproval';
    case 'returned': return 'Returned';
    case 'approved': return 'Approved';
    case 'pendingSignatures': return 'PendingSignatures';
    case 'closed': return 'Closed';
    default: return fallback;
  }
}

export const PMPPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject, currentUser } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [plan, setPlan] = React.useState<IProjectManagementPlan | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getProjectManagementPlan(projectCode)
      .then(result => setPlan(result))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  // Stage 12: Workflow machine path is now permanent.
  const optimisticMutation = useHbcOptimisticMutation<IProjectManagementPlan, { eventType: string }, IProjectManagementPlan | null>({
    method: 'submitPMPForApproval',
    domainFlag: OPTIMISTIC_MUTATION_FLAGS.workflows,
    mutationFn: async ({ eventType }) => {
      if (!plan) throw new Error('No PMP loaded');
      const actorName = currentUser?.email ?? 'system';
      // All PMP events route through submitPMPForApproval for now —
      // machine guards prevent illegal transitions.
      switch (eventType) {
        case 'SUBMIT_FOR_APPROVAL':
        case 'RESUBMIT':
          return dataService.submitPMPForApproval(projectCode, actorName);
        default:
          // For APPROVE_STEP, APPROVE_FINAL, RETURN_STEP, BEGIN_SIGNATURES, SIGN, SIGN_FINAL:
          // route through submit as the canonical mutation endpoint.
          return dataService.submitPMPForApproval(projectCode, actorName);
      }
    },
    getStateKey: () => ['pmp', projectCode],
    applyOptimistic: (previous) => previous ?? null,
    onSettledEffects: async () => {
      const refreshed = await dataService.getProjectManagementPlan(projectCode);
      setPlan(refreshed);
    },
  });

  const workflowInput = React.useMemo(() => ({
    pmpId: plan?.id ?? 0,
    projectCode: plan?.projectCode ?? projectCode,
    currentStatus: (plan?.status ?? 'Draft') as PMPStatus,
    pendingSteps: plan?.approvalCycles?.[plan.approvalCycles.length - 1]?.steps?.filter(s => s.status === 'Pending').length ?? 3,
    pendingSignatures: [...(plan?.startupSignatures ?? []), ...(plan?.completionSignatures ?? [])].filter(s => s.status === 'Pending').length || 3,
    actorRole: getActorRole(currentUser?.roles ?? []),
    userPermissions: Array.from(currentUser?.permissions ?? new Set<string>()),
  }), [plan?.id, plan?.projectCode, plan?.status, plan?.approvalCycles, plan?.startupSignatures, plan?.completionSignatures, currentUser?.roles, currentUser?.permissions, projectCode]);

  const workflow = useWorkflowMachine({
    machineType: 'pmpApproval',
    enabled: !!plan,
    input: workflowInput,
  });

  const transition = useWorkflowTransition({
    workflow,
    mutation: optimisticMutation,
  });

  // Display status: machine state when enabled, otherwise plan.status
  const displayStatus = React.useMemo((): PMPStatus => {
    if (plan && workflow.state) {
      return mapStateToDisplayStatus(workflow.state, plan.status);
    }
    return plan?.status ?? 'Draft';
  }, [plan, workflow.state]);

  const runWorkflowAction = React.useCallback(async (eventType: string): Promise<void> => {
    if (!plan) return;

    try {
      await transition.transition(
        eventType,
        { eventType },
        { actorRole: getActorRole(currentUser?.roles ?? []), reason: 'Workflow UI action' }
      );
      addToast(`PMP action "${PMP_EVENT_LABELS[eventType] ?? eventType}" completed.`, 'success');
    } catch {
      addToast('Failed to complete PMP workflow action.', 'error');
    }
  }, [plan, transition, currentUser?.roles, addToast]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Project Management Plan" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Project Management Plan" />
        <HbcSkeleton variant="card" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div>
        <PageHeader title="Project Management Plan" />
        <HbcEmptyState
          title="No Project Management Plan Found"
          description="A Project Management Plan has not been created for this project yet."
        />
      </div>
    );
  }

  const statusStyle = STATUS_MAP[displayStatus] || STATUS_MAP.Draft;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Management Plan"
        subtitle={`${plan.projectName} - ${plan.jobNumber}`}
        actions={
          <div className={styles.headerRow}>
            <StatusBadge
              label={displayStatus}
              color={statusStyle.color}
              backgroundColor={statusStyle.backgroundColor}
              size="medium"
            />
          </div>
        }
      />

      <div className={styles.metaRow}>
        <span>Division: {plan.division}</span>
        <span>Cycle: {plan.currentCycleNumber}</span>
        <span>Last Updated: {plan.lastUpdatedAt}</span>
      </div>

      {plan && workflow.isReady && (
        <div className={styles.actions}>
          {workflow.allowedEvents.map((eventType) => (
            <Button
              key={eventType}
              size="small"
              appearance="secondary"
              disabled={!workflow.can(eventType) || transition.isTransitioning}
              onClick={() => void runWorkflowAction(eventType)}
              data-testid={`pmp-machine-action-${eventType}`}
            >
              {PMP_EVENT_LABELS[eventType] ?? eventType}
            </Button>
          ))}
          {transition.isTransitioning && <Spinner size="tiny" />}
        </div>
      )}

      {plan.boilerplate.map(section => (
        <CollapsibleSection
          key={section.sectionNumber}
          title={`${section.sectionNumber}. ${section.sectionTitle}`}
          defaultExpanded={false}
        >
          <div className={styles.sectionContent}>{section.content}</div>
        </CollapsibleSection>
      ))}

      {plan.superintendentPlan && (
        <CollapsibleSection title="Superintendent's Plan" defaultExpanded={false}>
          <div className={styles.sectionContent}>{plan.superintendentPlan}</div>
        </CollapsibleSection>
      )}

      {plan.preconMeetingNotes && (
        <CollapsibleSection title="Preconstruction Meeting Notes" defaultExpanded={false}>
          <div className={styles.sectionContent}>{plan.preconMeetingNotes}</div>
        </CollapsibleSection>
      )}

      {plan.siteManagementNotes && (
        <CollapsibleSection title="Site Management Notes" defaultExpanded={false}>
          <div className={styles.sectionContent}>{plan.siteManagementNotes}</div>
        </CollapsibleSection>
      )}

    </div>
  );
};
