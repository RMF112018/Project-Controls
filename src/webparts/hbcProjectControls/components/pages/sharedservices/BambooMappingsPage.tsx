import * as React from 'react';
import { makeStyles, shorthands, tokens, Badge } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IBambooHREmployeeMapping } from '@hbc/sp-services';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '0'),
    flexWrap: 'wrap' as const,
    ...shorthands.gap('12px'),
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
  resultBanner: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorStatusSuccessBackground2,
    color: tokens.colorStatusSuccessForeground2,
    fontSize: '14px',
    ...shorthands.margin('0', '0', '16px'),
  },
});

export const BambooMappingsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService } = useAppContext();
  const [mappings, setMappings] = React.useState<IBambooHREmployeeMapping[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [autoMapping, setAutoMapping] = React.useState(false);
  const [autoMapResult, setAutoMapResult] = React.useState<{ mapped: number; unmatched: number } | null>(null);

  React.useEffect(() => {
    dataService
      .getBambooEmployeeMappings()
      .then(result => setMappings(result))
      .catch(() => setMappings([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  const handleAutoMap = React.useCallback(async () => {
    setAutoMapping(true);
    setAutoMapResult(null);
    try {
      const result = await dataService.autoMapBambooEmployees();
      setAutoMapResult(result);
      const updated = await dataService.getBambooEmployeeMappings();
      setMappings(updated);
    } finally {
      setAutoMapping(false);
    }
  }, [dataService]);

  const autoMappedCount = mappings.filter(m => m.autoMapped).length;
  const confirmedCount = mappings.filter(m => m.confirmedBy).length;

  return (
    <div>
      <PageHeader title="Employee Mappings" subtitle="Map BambooHR employees to HBC user accounts." />
      {!loading && mappings.length > 0 && (
        <div className={styles.kpiGrid}>
          <KPICard title="Total Mappings" value={mappings.length} />
          <KPICard title="Auto-Mapped" value={autoMappedCount} />
          <KPICard title="Confirmed" value={confirmedCount} />
        </div>
      )}
      {autoMapResult && (
        <div className={styles.resultBanner}>
          Auto-mapping complete: {autoMapResult.mapped} mapped, {autoMapResult.unmatched} unmatched.
        </div>
      )}
      <div className={styles.toolbar}>
        <span style={{ fontSize: '14px', color: tokens.colorNeutralForeground3 }}>
          {mappings.length} mappings
        </span>
        <HbcButton emphasis="strong" isLoading={autoMapping} onClick={handleAutoMap}>
          Auto-Map All
        </HbcButton>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : mappings.length === 0 ? (
        <p className={styles.noData}>No employee mappings found. Try auto-mapping.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>BambooHR ID</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>HBC User ID</th>
              <th className={styles.th}>Auto-Mapped</th>
              <th className={styles.th}>Confirmed By</th>
              <th className={styles.th}>Confirmed At</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(mapping => (
              <tr key={mapping.id}>
                <td className={styles.td}>{mapping.bambooId}</td>
                <td className={styles.td}>{mapping.email}</td>
                <td className={styles.td}>{mapping.hbcUserId}</td>
                <td className={styles.td}>
                  <Badge appearance="filled" color={mapping.autoMapped ? 'informative' : 'subtle'}>
                    {mapping.autoMapped ? 'Auto' : 'Manual'}
                  </Badge>
                </td>
                <td className={styles.td}>{mapping.confirmedBy ?? '—'}</td>
                <td className={styles.td}>
                  {mapping.confirmedAt ? new Date(mapping.confirmedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
