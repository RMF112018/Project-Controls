import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import type { IActiveProject } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

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
  dateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  dateLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  dateValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  activityItem: {
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
});

export const ProjectDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const [project, setProject] = React.useState<IActiveProject | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getActiveProjects()
      .then(projects => {
        const found = projects.find(p => p.projectCode === projectCode) || null;
        setProject(found);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Project Dashboard" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to view the dashboard."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Project Dashboard" />
        <HbcSkeleton variant="kpi-grid" columns={4} />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Project Dashboard" />
        <HbcEmptyState
          title="Project Not Found"
          description="The selected project could not be loaded."
        />
      </div>
    );
  }

  const contractValue = project.financials.currentContractValue
    ? `$${(project.financials.currentContractValue / 1000000).toFixed(1)}M`
    : 'N/A';

  const budgetStatus = project.financials.projectedFeePct
    ? `${project.financials.projectedFeePct.toFixed(1)}%`
    : 'N/A';

  const scheduleStatus = project.schedule.percentComplete
    ? `${project.schedule.percentComplete}%`
    : 'N/A';

  const teamSize = [
    project.personnel.projectExecutive,
    project.personnel.leadPM,
    project.personnel.additionalPM,
    project.personnel.assistantPM,
    project.personnel.projectAccountant,
    project.personnel.projectAssistant,
    project.personnel.leadSuper,
    project.personnel.superintendent,
    project.personnel.assistantSuper,
  ].filter(Boolean).length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Dashboard"
        subtitle={`${project.projectName} (${project.jobNumber})`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Contract Value" value={contractValue} />
        <KPICard title="Budget Status" value={budgetStatus} subtitle="Projected Fee %" />
        <KPICard title="Schedule Status" value={scheduleStatus} subtitle="Percent Complete" />
        <KPICard title="Team Size" value={teamSize} />
      </div>

      <div className={styles.sectionGrid}>
        <HbcCard title="Key Dates">
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Start Date</span>
            <span className={styles.dateValue}>{project.schedule.startDate || 'TBD'}</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Substantial Completion</span>
            <span className={styles.dateValue}>{project.schedule.substantialCompletionDate || 'TBD'}</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>NOC Expiration</span>
            <span className={styles.dateValue}>{project.schedule.nocExpiration || 'TBD'}</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateLabel}>Current Phase</span>
            <span className={styles.dateValue}>{project.schedule.currentPhase || 'N/A'}</span>
          </div>
        </HbcCard>

        <HbcCard title="Recent Activity">
          <div className={styles.activityItem}>
            Status: {project.status}
          </div>
          <div className={styles.activityItem}>
            Sector: {project.sector}
          </div>
          {project.statusComments && (
            <div className={styles.activityItem}>
              {project.statusComments}
            </div>
          )}
          {project.lastModified && (
            <div className={styles.activityItem}>
              Last Modified: {project.lastModified}
            </div>
          )}
        </HbcCard>
      </div>
    </div>
  );
};
