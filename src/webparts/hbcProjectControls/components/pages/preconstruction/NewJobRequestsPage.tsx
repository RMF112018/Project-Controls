import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { useAppContext } from '../../contexts/AppContext';
import { JobNumberRequestStatus } from '@hbc/sp-services';
import type { IJobNumberRequest } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  statusPill: {
    display: 'inline-block',
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
  },
});

const NewJobRequestsPageInner: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['job-number-requests'],
    queryFn: () => dataService.getJobNumberRequests(),
    staleTime: 5 * 60_000,
  });

  const columns = React.useMemo((): IHbcDataTableColumn<IJobNumberRequest>[] => [
    { key: 'Originator', header: 'Lead', render: (row) => row.Originator || '\u2014' },
    {
      key: 'RequestStatus',
      header: 'Status',
      render: (row) => {
        const status = row.RequestStatus || '\u2014';
        const bg = status === JobNumberRequestStatus.Completed ? tokens.colorStatusSuccessBackground2 : tokens.colorStatusWarningBackground2;
        const fg = status === JobNumberRequestStatus.Completed ? tokens.colorStatusSuccessForeground2 : tokens.colorStatusWarningForeground2;
        return <span className={styles.statusPill} style={{ backgroundColor: bg, color: fg }}>{status}</span>;
      },
    },
    { key: 'RequestedBy', header: 'Requested By', render: (row) => row.Originator || '\u2014' },
    { key: 'RequestDate', header: 'Requested', render: (row) => row.RequestDate ? new Date(row.RequestDate).toLocaleDateString() : '\u2014' },
    { key: 'AssignedJobNumber', header: 'Job #', render: (row) => row.AssignedJobNumber || '\u2014' },
  ], [styles]);

  return (
    <div>
      <PageHeader title="New Job Requests" />
      <div className={styles.container}>
        <HbcDataTable
          tableId="precon-job-requests"
          columns={columns}
          items={requests}
          isLoading={isLoading}
          keyExtractor={(row) => String(row.id)}
          ariaLabel="New job requests tracking table"
        />
      </div>
    </div>
  );
};

export const NewJobRequestsPage = React.memo(NewJobRequestsPageInner);
