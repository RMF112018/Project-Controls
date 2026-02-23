import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import type { IEstimatingTracker } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '12px',
    fontWeight: 500 as const,
  },
});

export const DepartmentTrackingPage: React.FC = () => {
  const styles = useStyles();

  const columns = React.useMemo((): IHbcDataTableColumn<IEstimatingTracker>[] => [
    { key: 'Title', header: 'Lead', render: (row) => row.Title || '—' },
    {
      key: 'AwardStatus',
      header: 'Status',
      render: (row) => {
        const status = row.AwardStatus || '—';
        const bg = status === 'Pending' ? tokens.colorStatusWarningBackground2 : status === 'Not Awarded' ? tokens.colorStatusDangerBackground2 : tokens.colorStatusSuccessBackground2;
        const fg = status === 'Pending' ? tokens.colorStatusWarningForeground2 : status === 'Not Awarded' ? tokens.colorStatusDangerForeground2 : tokens.colorStatusSuccessForeground2;
        return <span className={styles.statusPill} style={{ backgroundColor: bg, color: fg }}>{status}</span>;
      },
    },
    { key: 'LeadEstimator', header: 'Estimator', render: (row) => row.LeadEstimator || '—' },
    { key: 'DueDate_OutTheDoor', header: 'Due Date', render: (row) => row.DueDate_OutTheDoor ? new Date(row.DueDate_OutTheDoor).toLocaleDateString() : '—' },
  ], [styles]);
  const { dataService } = useAppContext();
  const [records, setRecords] = React.useState<IEstimatingTracker[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getEstimatingRecords()
      .then(result => setRecords(result.items))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  return (
    <div>
      <PageHeader title="Department Tracking" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-dept-tracking"
          columns={columns}
          items={records}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};
