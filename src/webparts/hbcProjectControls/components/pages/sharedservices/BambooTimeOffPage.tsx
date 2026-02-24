import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useConnectorMutation } from '../../../tanstack/query/mutations/useConnectorMutation';
import type { IBambooHRTimeOff, IConnectorRetryPolicy } from '@hbc/sp-services';

const BAMBOO_RETRY_POLICY: IConnectorRetryPolicy = {
  retryableStatuses: [500, 502, 503],
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
};

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger'> = {
  Approved: 'success',
  Pending: 'warning',
  Denied: 'danger',
};

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '0'),
  },
  count: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '0', '8px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  th: {
    textAlign: 'left' as const,
    ...shorthands.padding('10px', '12px'),
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  thRight: {
    textAlign: 'right' as const,
    ...shorthands.padding('10px', '12px'),
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  tdRight: {
    textAlign: 'right' as const,
    ...shorthands.padding('10px', '12px'),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    fontVariantNumeric: 'tabular-nums',
  },
  noData: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const BambooTimeOffPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [records, setRecords] = React.useState<IBambooHRTimeOff[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Phase 5A.1: Connector mutation via useConnectorMutation (resilience hook)
  const syncMutation = useConnectorMutation<IBambooHRTimeOff[], void>({
    operationName: 'bamboo:syncTimeOff',
    mutationFn: async () => {
      await dataService.syncBambooTimeOff();
      return dataService.getBambooTimeOff();
    },
    retryPolicy: BAMBOO_RETRY_POLICY,
    onSuccess: (updated) => setRecords(updated),
  });

  React.useEffect(() => {
    dataService
      .getBambooTimeOff()
      .then(result => setRecords(result))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const approvedCount = records.filter(r => r.status === 'Approved').length;
  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const totalHours = records.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.hours, 0);

  return (
    <div>
      <PageHeader title="Time Off" subtitle="Employee time-off requests synced from BambooHR." />
      {!loading && records.length > 0 && (
        <div className={styles.kpiGrid}>
          <KPICard title="Total Requests" value={records.length} />
          <KPICard title="Approved" value={approvedCount} />
          <KPICard title="Pending" value={pendingCount} />
          <KPICard title="Approved Hours" value={totalHours} />
        </div>
      )}
      <div className={styles.toolbar}>
        <span className={styles.count}>{records.length} time-off requests</span>
        <HbcButton emphasis="strong" isLoading={syncMutation.isPending} onClick={() => syncMutation.mutate(undefined as unknown as void)}>
          Sync Time Off
        </HbcButton>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : records.length === 0 ? (
        <p className={styles.noData}>No time-off records found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Employee ID</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Start Date</th>
              <th className={styles.th}>End Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.thRight}>Hours</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td className={styles.td}>{record.employeeId}</td>
                <td className={styles.td}>{record.type}</td>
                <td className={styles.td}>{new Date(record.startDate).toLocaleDateString()}</td>
                <td className={styles.td}>{new Date(record.endDate).toLocaleDateString()}</td>
                <td className={styles.td}>
                  <Badge appearance="filled" color={STATUS_COLOR[record.status] ?? 'informative'}>
                    {record.status}
                  </Badge>
                </td>
                <td className={styles.tdRight}>{record.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
