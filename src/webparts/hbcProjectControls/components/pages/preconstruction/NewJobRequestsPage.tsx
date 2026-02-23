import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { JobNumberRequestStatus } from '@hbc/sp-services';
import type { IJobNumberRequest } from '@hbc/sp-services';

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

export const NewJobRequestsPage: React.FC = () => {
  const styles = useStyles();

  const columns = React.useMemo((): IHbcDataTableColumn<IJobNumberRequest>[] => [
    { key: 'Originator', header: 'Lead', render: (row) => row.Originator || '—' },
    {
      key: 'RequestStatus',
      header: 'Status',
      render: (row) => {
        const status = row.RequestStatus || '—';
        const bg = status === JobNumberRequestStatus.Completed ? tokens.colorStatusSuccessBackground2 : tokens.colorStatusWarningBackground2;
        const fg = status === JobNumberRequestStatus.Completed ? tokens.colorStatusSuccessForeground2 : tokens.colorStatusWarningForeground2;
        return <span className={styles.statusPill} style={{ backgroundColor: bg, color: fg }}>{status}</span>;
      },
    },
    { key: 'RequestedBy', header: 'Requested By', render: (row) => row.Originator || '—' },
    { key: 'RequestDate', header: 'Requested', render: (row) => row.RequestDate ? new Date(row.RequestDate).toLocaleDateString() : '—' },
    { key: 'AssignedJobNumber', header: 'Job #', render: (row) => row.AssignedJobNumber || '—' },
  ], [styles]);
  const { dataService } = useAppContext();
  const [requests, setRequests] = React.useState<IJobNumberRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    dataService.getJobNumberRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  return (
    <div>
      <PageHeader title="New Job Requests" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-job-requests"
          columns={columns}
          items={requests}
          isLoading={loading}
          keyExtractor={(row) => String(row.id)}
        />
      </div>
    </div>
  );
};
