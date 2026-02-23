import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import type { IProcoreBudgetLineItem } from '@hbc/sp-services';

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '0', '16px'),
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export const ProcoreBudgetPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const [items, setItems] = React.useState<IProcoreBudgetLineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const projectCode = selectedProject?.projectCode ?? '';

  React.useEffect(() => {
    setLoading(true);
    dataService
      .getProcoreBudget(projectCode)
      .then(result => setItems(result))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleSync = React.useCallback(async () => {
    if (!projectCode) return;
    setSyncing(true);
    try {
      await dataService.syncProcoreBudget(projectCode);
      const updated = await dataService.getProcoreBudget(projectCode);
      setItems(updated);
    } finally {
      setSyncing(false);
    }
  }, [dataService, projectCode]);

  const totalOriginal = items.reduce((sum, i) => sum + i.originalBudget, 0);
  const totalProjected = items.reduce((sum, i) => sum + i.projectedCost, 0);
  const variance = totalOriginal - totalProjected;

  return (
    <div>
      <PageHeader title="Procore Budget" subtitle="Budget line items and cost projections from Procore." />
      {!loading && items.length > 0 && (
        <div className={styles.kpiGrid}>
          <KPICard title="Original Budget" value={formatCurrency(totalOriginal)} />
          <KPICard title="Projected Cost" value={formatCurrency(totalProjected)} />
          <KPICard title="Variance" value={formatCurrency(variance)} />
          <KPICard title="Line Items" value={items.length} />
        </div>
      )}
      <div className={styles.toolbar}>
        <span className={styles.count}>{items.length} line items</span>
        <HbcButton emphasis="strong" isLoading={syncing} onClick={handleSync}>
          Sync Budget
        </HbcButton>
      </div>
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : items.length === 0 ? (
        <p className={styles.noData}>No budget data found. Try syncing from Procore.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Cost Code</th>
              <th className={styles.th}>Description</th>
              <th className={styles.thRight}>Original Budget</th>
              <th className={styles.thRight}>Revised Budget</th>
              <th className={styles.thRight}>Commitments</th>
              <th className={styles.thRight}>Pending Changes</th>
              <th className={styles.thRight}>Projected Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className={styles.td}>{item.costCode}</td>
                <td className={styles.td}>{item.description}</td>
                <td className={styles.tdRight}>{formatCurrency(item.originalBudget)}</td>
                <td className={styles.tdRight}>{formatCurrency(item.revisedBudget)}</td>
                <td className={styles.tdRight}>{formatCurrency(item.commitments)}</td>
                <td className={styles.tdRight}>{formatCurrency(item.pendingChanges)}</td>
                <td className={styles.tdRight}>{formatCurrency(item.projectedCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
