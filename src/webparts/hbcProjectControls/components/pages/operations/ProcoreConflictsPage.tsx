import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IProcoreConflict } from '@hbc/sp-services';

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
  actions: {
    display: 'flex',
    ...shorthands.gap('6px'),
  },
  noData: {
    ...shorthands.padding('24px'),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
});

export const ProcoreConflictsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const [conflicts, setConflicts] = React.useState<IProcoreConflict[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resolvingId, setResolvingId] = React.useState<number | null>(null);

  const projectCode = selectedProject?.projectCode ?? '';

  React.useEffect(() => {
    setLoading(true);
    dataService
      .getProcoreConflicts(projectCode)
      .then(result => setConflicts(result))
      .catch(() => setConflicts([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleResolve = React.useCallback(
    async (conflictId: number, resolution: 'hbc' | 'procore') => {
      setResolvingId(conflictId);
      try {
        const updated = await dataService.resolveProcoreConflict(conflictId, resolution);
        setConflicts(prev => prev.map(c => (c.id === conflictId ? updated : c)));
      } finally {
        setResolvingId(null);
      }
    },
    [dataService],
  );

  const unresolvedCount = conflicts.filter(c => !c.resolution || c.resolution === 'pending').length;

  return (
    <div>
      <PageHeader title="Sync Conflicts" subtitle="Resolve data conflicts between Procore and HBC systems." />
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {unresolvedCount} unresolved of {conflicts.length} total
        </span>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : conflicts.length === 0 ? (
        <p className={styles.noData}>No sync conflicts detected.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Entity</th>
              <th className={styles.th}>Field</th>
              <th className={styles.th}>HBC Value</th>
              <th className={styles.th}>Procore Value</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Detected</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.map(conflict => {
              const isResolved = conflict.resolution && conflict.resolution !== 'pending';
              return (
                <tr key={conflict.id}>
                  <td className={styles.td}>
                    {conflict.entityType} #{conflict.entityId}
                  </td>
                  <td className={styles.td}>{conflict.field}</td>
                  <td className={styles.td}>{conflict.hbcValue}</td>
                  <td className={styles.td}>{conflict.procoreValue}</td>
                  <td className={styles.td}>
                    <Badge
                      appearance="filled"
                      color={isResolved ? 'success' : 'warning'}
                    >
                      {isResolved ? `Resolved (${conflict.resolution})` : 'Unresolved'}
                    </Badge>
                  </td>
                  <td className={styles.td}>{new Date(conflict.detectedAt).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    {!isResolved && (
                      <div className={styles.actions}>
                        <HbcButton
                          isLoading={resolvingId === conflict.id}
                          onClick={() => handleResolve(conflict.id, 'hbc')}
                        >
                          Keep HBC
                        </HbcButton>
                        <HbcButton
                          isLoading={resolvingId === conflict.id}
                          onClick={() => handleResolve(conflict.id, 'procore')}
                        >
                          Use Procore
                        </HbcButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
