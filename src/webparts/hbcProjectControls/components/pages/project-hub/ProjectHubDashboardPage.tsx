import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';
import { useSearch } from '@tanstack/react-router';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  value: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

export const ProjectHubDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const { addToast } = useToast();

  // Stage 19: Detect incoming handoff from Preconstruction turnover meeting.
  // When the turnover sign-off completes, it navigates here with ?handoffFrom=turnover.
  // The handoff mutation has already enriched the project record — we just notify the user.
  const searchParams = useSearch({ strict: false }) as { handoffFrom?: string; projectCode?: string };
  React.useEffect(() => {
    if (searchParams.handoffFrom === 'turnover' && selectedProject) {
      addToast(
        'Project handed off from Estimating. Turnover meeting complete — kickoff fields pre-populated.',
        'info',
        5000
      );
    }
  }, [searchParams.handoffFrom, selectedProject, addToast]);

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Project Dashboard" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the Project Dashboard."
        />
      </div>
    );
  }

  const projectName = selectedProject.projectName || 'Unknown Project';
  const projectCode = selectedProject.projectCode || '\u2014';

  // TODO (Stage 19 – Sub-task 9 cont.): Consume new deepBidPackage in KPI cards and handoff alerts (builds on existing Stage-18 handoff instrumentation). Reference: plan handoff integration.

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Dashboard"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Contract Value" value="$12.4M" trend={{ value: 2.1, isPositive: true }} />
        <KPICard title="% Complete" value="47%" subtitle="On track" />
        <KPICard title="Schedule Variance" value="+3 days" subtitle="Ahead of schedule" />
        <KPICard title="Cost Variance" value="-$45K" trend={{ value: 1.2, isPositive: true }} />
        <KPICard title="Open RFIs" value="12" subtitle="3 overdue" />
      </div>

      <div className={styles.sectionGrid}>
        <HbcCard title="Project Overview">
          <div className={styles.infoRow}>
            <span className={styles.label}>Project Code</span>
            <span className={styles.value}>{projectCode}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Client</span>
            <span className={styles.value}>{selectedProject.clientName || '\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Region</span>
            <span className={styles.value}>{selectedProject.region || '\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Division</span>
            <span className={styles.value}>{selectedProject.division || '\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Stage</span>
            <span className={styles.value}>{selectedProject.stage || '\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Health</span>
            <span className={styles.value}>{selectedProject.overallHealth || '\u2014'}</span>
          </div>
        </HbcCard>

        <HbcCard title="Team & Contacts">
          <div className={styles.infoRow}>
            <span className={styles.label}>Project Manager</span>
            <span className={styles.value}>Pending Assignment</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Superintendent</span>
            <span className={styles.value}>Pending Assignment</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Project Executive</span>
            <span className={styles.value}>Pending Assignment</span>
          </div>
        </HbcCard>

        <HbcCard title="Key Dates">
          <div className={styles.infoRow}>
            <span className={styles.label}>Notice to Proceed</span>
            <span className={styles.value}>{'\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Substantial Completion</span>
            <span className={styles.value}>{'\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Final Completion</span>
            <span className={styles.value}>{'\u2014'}</span>
          </div>
        </HbcCard>

        <HbcCard title="Recent Activity">
          <div className={styles.infoRow}>
            <span className={styles.label}>No recent activity</span>
            <span className={styles.value} />
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
