import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQueries } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { DashboardKpiGrid } from '../../common/DashboardKpiGrid';
import type { IDashboardKpiItem } from '../../common/DashboardKpiGrid';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { activeProjectsOptions, scheduleMetricsOptions, deliverablesOptions } from '../../../tanstack/query/queryOptions/operations';
import { HBC_COLORS } from '../../../theme/tokens';
import { useSearch } from '@tanstack/react-router';
import type { IActiveProject } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
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

// P1.1: Formatting helpers for KPI derivation
function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

function formatSignedCurrency(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

export const ProjectHubDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject, dataService } = useAppContext();
  const scope = useQueryScope();
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

  // P1.1: Three parallel queries → five KPI derivations
  // Placed before early return to satisfy React hooks ordering rules.
  // Queries use `enabled` to avoid firing when no project is selected.
  const currentProjectCode = selectedProject?.projectCode ?? '';
  const [projectResult, scheduleResult, deliverablesResult] = useQueries({
    queries: [
      {
        ...activeProjectsOptions(scope, dataService),
        select: (data: IActiveProject[]) =>
          data.find((p) => p.projectCode === currentProjectCode),
        enabled: !!currentProjectCode,
      },
      scheduleMetricsOptions(scope, dataService, currentProjectCode),
      deliverablesOptions(scope, dataService, currentProjectCode),
    ],
  });

  const isKpiLoading = projectResult.isLoading || scheduleResult.isLoading || deliverablesResult.isLoading;
  const isKpiError = projectResult.isError || scheduleResult.isError || deliverablesResult.isError;

  // P1.1: Derive 5 KPIs from query data
  const kpis = React.useMemo((): IDashboardKpiItem[] | null => {
    const project = projectResult.data;
    const metrics = scheduleResult.data;
    const deliverables = deliverablesResult.data;

    if (!project) return null;

    const fin = project.financials;
    const pctComplete = project.schedule.percentComplete ?? 0;
    const costVariance = (fin.currentContractValue ?? 0) - (fin.projectedCost ?? 0);
    const openDeliverables = (deliverables ?? []).filter(
      (d) => d.status !== 'Complete'
    ).length;
    const overdue = (deliverables ?? []).filter(
      (d) => d.status !== 'Complete' && d.dueDate && new Date(d.dueDate) < new Date()
    ).length;

    // Schedule variance from earned value metrics (SV in duration units)
    const sv = metrics?.earnedValueMetrics?.sv;
    const spi = metrics?.spiApproximation;
    const schedVarLabel = sv != null ? `${sv >= 0 ? '+' : ''}${sv.toFixed(0)} days` : '\u2014';
    const schedSubtitle = spi != null
      ? spi >= 1.0 ? 'Ahead of schedule' : spi >= 0.9 ? 'On track' : 'Behind schedule'
      : undefined;

    return [
      {
        key: 'contract',
        title: 'Contract Value',
        value: formatCurrency(fin.currentContractValue ?? 0),
        trend: fin.changeOrders ? { value: Number(((fin.changeOrders / (fin.originalContract || 1)) * 100).toFixed(1)), isPositive: (fin.changeOrders ?? 0) >= 0 } : undefined,
      },
      {
        key: 'complete',
        title: '% Complete',
        value: `${pctComplete}%`,
        subtitle: pctComplete >= 100 ? 'Complete' : pctComplete > 0 ? 'In progress' : 'Not started',
      },
      {
        key: 'sched-var',
        title: 'Schedule Variance',
        value: schedVarLabel,
        subtitle: schedSubtitle,
      },
      {
        key: 'cost-var',
        title: 'Cost Variance',
        value: formatSignedCurrency(costVariance),
        trend: { value: Number(Math.abs((costVariance / (fin.currentContractValue || 1)) * 100).toFixed(1)), isPositive: costVariance >= 0 },
      },
      {
        key: 'deliverables',
        title: 'Open Deliverables',
        value: String(openDeliverables),
        subtitle: overdue > 0 ? `${overdue} overdue` : undefined,
      },
    ];
  }, [projectResult.data, scheduleResult.data, deliverablesResult.data]);

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

      <ErrorBoundary boundaryName="ProjectHubDashboard">
        <React.Suspense fallback={<SkeletonLoader variant="table" rows={3} columns={5} />}>
          {isKpiError ? (
            <HbcEmptyState
              title="Error loading KPIs"
              description="Unable to load project metrics. Please try again."
              actions={[{
                id: 'retry-kpis',
                label: 'Retry',
                appearance: 'primary',
                onClick: () => {
                  void projectResult.refetch();
                  void scheduleResult.refetch();
                  void deliverablesResult.refetch();
                },
              }]}
            />
          ) : (
            <DashboardKpiGrid
              items={kpis ?? []}
              isLoading={isKpiLoading}
            />
          )}

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
        </React.Suspense>
      </ErrorBoundary>
    </div>
  );
};
