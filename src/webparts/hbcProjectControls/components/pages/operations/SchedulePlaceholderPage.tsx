import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { ComingSoonPage } from '../../shared/ComingSoonPage';
import { useAppContext } from '../../contexts/AppContext';
import type { IScheduleMetrics } from '@hbc/sp-services';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
  },
  placeholderWrap: {
    marginTop: tokens.spacingVerticalL,
  },
});

export const SchedulePlaceholderPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';

  const [metrics, setMetrics] = React.useState<IScheduleMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!projectCode) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await dataService.getScheduleMetrics(projectCode);
        if (!cancelled) setMetrics(data);
      } catch (err) {
        console.error('Failed to load schedule metrics:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Schedule" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view schedule data." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader title="Schedule" subtitle="Project schedule overview and metrics" />

      {isLoading ? (
        <HbcSkeleton variant="kpi-grid" columns={4} />
      ) : (
        <div className={styles.kpiRow}>
          <KPICard
            title="Total Activities"
            value={metrics?.totalActivities ?? '--'}
          />
          <KPICard
            title="Critical Path Items"
            value={metrics?.criticalActivityCount ?? '--'}
          />
          <KPICard
            title="% Complete"
            value={metrics ? `${Math.round(metrics.percentComplete)}%` : '--'}
          />
          <KPICard
            title="Avg Float Days"
            value={metrics ? Math.round(metrics.averageFloat) : '--'}
          />
        </div>
      )}

      <div className={styles.placeholderWrap}>
        <ComingSoonPage title="Schedule v2" />
      </div>
    </div>
  );
};
