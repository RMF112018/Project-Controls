import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import type { IProjectManagementPlan } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_MAP: Record<string, { color: string; backgroundColor: string }> = {
  Draft: { color: HBC_COLORS.gray500, backgroundColor: HBC_COLORS.gray100 },
  PendingSignatures: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
  PendingApproval: { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
  Approved: { color: HBC_COLORS.success, backgroundColor: HBC_COLORS.successLight },
  Returned: { color: HBC_COLORS.error, backgroundColor: HBC_COLORS.errorLight },
  Closed: { color: HBC_COLORS.gray500, backgroundColor: HBC_COLORS.gray200 },
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
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '0'),
  },
});

export const PMPPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject, currentUser } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [plan, setPlan] = React.useState<IProjectManagementPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

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

  const handleSubmitForApproval = React.useCallback(async (): Promise<void> => {
    if (!projectCode || !currentUser) return;

    setSubmitting(true);
    try {
      const updated = await dataService.submitPMPForApproval(projectCode, currentUser.email);
      setPlan(updated);
      addToast('PMP submitted for approval.', 'success');
    } catch {
      addToast('Failed to submit PMP for approval.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [dataService, projectCode, currentUser, addToast]);

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

  const statusStyle = STATUS_MAP[plan.status] || STATUS_MAP.Draft;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Management Plan"
        subtitle={`${plan.projectName} - ${plan.jobNumber}`}
        actions={
          <div className={styles.headerRow}>
            <StatusBadge
              label={plan.status}
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

      <div className={styles.actions}>
        {plan.status === 'Draft' && (
          <HbcButton
            emphasis="strong"
            onClick={handleSubmitForApproval}
            isLoading={submitting}
          >
            Submit for Approval
          </HbcButton>
        )}
      </div>
    </div>
  );
};
