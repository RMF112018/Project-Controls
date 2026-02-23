import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IProcoreRFI } from '@hbc/sp-services';

const RFI_STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'informative'> = {
  Open: 'warning',
  Closed: 'success',
  Draft: 'informative',
  Overdue: 'danger',
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
  td: {
    ...shorthands.padding('10px', '12px'),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  noData: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const ProcoreRFIsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const [rfis, setRfis] = React.useState<IProcoreRFI[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';

  React.useEffect(() => {
    setLoading(true);
    dataService
      .getProcoreRFIs(projectCode)
      .then(result => setRfis(result))
      .catch(() => setRfis([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleSync = React.useCallback(async () => {
    if (!projectCode) return;
    setSyncing(true);
    try {
      await dataService.syncProcoreRFIs(projectCode);
      const updated = await dataService.getProcoreRFIs(projectCode);
      setRfis(updated);
    } finally {
      setSyncing(false);
    }
  }, [dataService, projectCode]);

  return (
    <div>
      <PageHeader title="Procore RFIs" subtitle="Requests for Information synced from Procore." />
      <div className={styles.toolbar}>
        <span className={styles.count}>{rfis.length} RFIs</span>
        <HbcButton emphasis="strong" isLoading={syncing} onClick={handleSync}>
          Sync RFIs
        </HbcButton>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : rfis.length === 0 ? (
        <p className={styles.noData}>No RFIs found. Try syncing from Procore.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Subject</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Assignee</th>
              <th className={styles.th}>Due Date</th>
              <th className={styles.th}>Project</th>
            </tr>
          </thead>
          <tbody>
            {rfis.map(rfi => (
              <tr key={rfi.id}>
                <td className={styles.td}>{rfi.number}</td>
                <td className={styles.td}>{rfi.subject}</td>
                <td className={styles.td}>
                  <Badge appearance="filled" color={RFI_STATUS_COLOR[rfi.status] ?? 'informative'}>
                    {rfi.status}
                  </Badge>
                </td>
                <td className={styles.td}>{rfi.assignee}</td>
                <td className={styles.td}>{rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString() : '—'}</td>
                <td className={styles.td}>{rfi.hbcProjectCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
