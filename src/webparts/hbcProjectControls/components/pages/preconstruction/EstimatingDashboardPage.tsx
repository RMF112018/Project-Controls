import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { AwardStatus } from '@hbc/sp-services';
import type { IEstimatingTracker } from '@hbc/sp-services';

const useStyles = makeStyles({
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
  },
});

export const EstimatingDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [records, setRecords] = React.useState<IEstimatingTracker[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getEstimatingRecords()
      .then(result => setRecords(result.items))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const active = records.filter(r => r.AwardStatus === AwardStatus.Pending);
  const completed = records.filter(r => r.AwardStatus === AwardStatus.AwardedWithPrecon || r.AwardStatus === AwardStatus.AwardedWithoutPrecon || r.AwardStatus === AwardStatus.NotAwarded);

  return (
    <div>
      <PageHeader title="Estimating Dashboard" />
      {loading ? <HbcSkeleton variant="kpi-grid" columns={3} /> : <div className={styles.kpiGrid}>
        <KPICard title="Total Estimates" value={records.length} />
        <KPICard title="Active" value={active.length} />
        <KPICard title="Completed" value={completed.length} />
      </div>}
    </div>
  );
};
