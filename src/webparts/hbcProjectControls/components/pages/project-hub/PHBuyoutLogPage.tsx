import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  formatCurrency,
  type ProjectHubBuyoutPackage as IBuyoutPackage,
  type ProjectHubBuyoutStatus as BuyoutStatus,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_BUYOUT_PACKAGES: IBuyoutPackage[] = [
  { id: 'bp-1', tradePackage: 'Structural Steel', divisionCode: '05 12 00', budgetAmount: 2_800_000, buyoutAmount: 2_720_000, savings: 80_000, status: 'Executed', subcontractor: 'Atlas Steel Fabricators', targetDate: '2025-11-15' },
  { id: 'bp-2', tradePackage: 'Mechanical HVAC', divisionCode: '23 00 00', budgetAmount: 1_950_000, buyoutAmount: 1_880_000, savings: 70_000, status: 'Executed', subcontractor: 'Coastal Mechanical Inc.', targetDate: '2025-12-01' },
  { id: 'bp-3', tradePackage: 'Electrical', divisionCode: '26 00 00', budgetAmount: 1_650_000, buyoutAmount: 1_620_000, savings: 30_000, status: 'Awarded', subcontractor: 'PowerLine Electric', targetDate: '2026-01-15' },
  { id: 'bp-4', tradePackage: 'Plumbing', divisionCode: '22 00 00', budgetAmount: 890_000, buyoutAmount: 875_000, savings: 15_000, status: 'Awarded', subcontractor: 'Southeast Plumbing Co.', targetDate: '2026-01-20' },
  { id: 'bp-5', tradePackage: 'Fire Protection', divisionCode: '21 00 00', budgetAmount: 420_000, buyoutAmount: null, savings: null, status: 'Evaluating', subcontractor: null, targetDate: '2026-02-28' },
  { id: 'bp-6', tradePackage: 'Drywall & Framing', divisionCode: '09 21 00', budgetAmount: 1_100_000, buyoutAmount: null, savings: null, status: 'Bidding', subcontractor: null, targetDate: '2026-03-15' },
  { id: 'bp-7', tradePackage: 'Painting & Finishes', divisionCode: '09 91 00', budgetAmount: 380_000, buyoutAmount: null, savings: null, status: 'Bidding', subcontractor: null, targetDate: '2026-04-01' },
  { id: 'bp-8', tradePackage: 'Elevator', divisionCode: '14 20 00', budgetAmount: 520_000, buyoutAmount: null, savings: null, status: 'Not Started', subcontractor: null, targetDate: '2026-04-15' },
  { id: 'bp-9', tradePackage: 'Landscaping', divisionCode: '32 90 00', budgetAmount: 280_000, buyoutAmount: null, savings: null, status: 'Not Started', subcontractor: null, targetDate: '2026-06-01' },
];

const STATUS_CONFIG: Record<BuyoutStatus, { color: string; bg: string }> = {
  'Not Started': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
  'Bidding': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Evaluating': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Awarded': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Executed': { color: HBC_COLORS.navy, bg: HBC_COLORS.gray200 },
};

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  tableHead: {
    backgroundColor: HBC_COLORS.gray50,
  },
  th: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'left' as const,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.gray200),
  },
  thRight: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'right' as const,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.gray200),
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
  },
  tdCode: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  tdRight: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground1,
  },
  positive: {
    color: HBC_COLORS.success,
  },
  totalRow: {
    fontWeight: tokens.fontWeightBold,
    backgroundColor: HBC_COLORS.gray50,
  },
});

export const PHBuyoutLogPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const totalBudget = MOCK_BUYOUT_PACKAGES.reduce((sum, p) => sum + p.budgetAmount, 0);
  const totalBuyout = MOCK_BUYOUT_PACKAGES.reduce((sum, p) => sum + (p.buyoutAmount || 0), 0);
  const totalSavings = MOCK_BUYOUT_PACKAGES.reduce((sum, p) => sum + (p.savings || 0), 0);
  const executedCount = MOCK_BUYOUT_PACKAGES.filter(p => p.status === 'Executed' || p.status === 'Awarded').length;
  const buyoutPct = Math.round((executedCount / MOCK_BUYOUT_PACKAGES.length) * 100);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Buyout Log"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Budget"
          value={formatCurrency(totalBudget)}
        />
        <KPICard
          title="Committed (Bought Out)"
          value={formatCurrency(totalBuyout)}
          subtitle={`${buyoutPct}% of packages committed`}
        />
        <KPICard
          title="Buyout Savings"
          value={formatCurrency(totalSavings)}
          trend={{ value: 2.0, isPositive: true }}
        />
        <KPICard
          title="Packages Complete"
          value={`${executedCount}/${MOCK_BUYOUT_PACKAGES.length}`}
          subtitle={`${MOCK_BUYOUT_PACKAGES.length - executedCount} remaining`}
        />
      </div>

      <HbcCard title="Trade Packages" subtitle="Buyout status by trade package">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Trade Package</th>
              <th className={styles.th}>Division</th>
              <th className={styles.thRight}>Budget</th>
              <th className={styles.thRight}>Buyout Amount</th>
              <th className={styles.thRight}>Savings</th>
              <th className={styles.th}>Subcontractor</th>
              <th className={styles.th}>Target Date</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_BUYOUT_PACKAGES.map((pkg) => {
              const statusCfg = STATUS_CONFIG[pkg.status];
              return (
                <tr key={pkg.id}>
                  <td className={styles.td} style={{ fontWeight: tokens.fontWeightSemibold as string }}>{pkg.tradePackage}</td>
                  <td className={styles.tdCode}>{pkg.divisionCode}</td>
                  <td className={styles.tdRight}>{formatCurrency(pkg.budgetAmount)}</td>
                  <td className={styles.tdRight}>{pkg.buyoutAmount ? formatCurrency(pkg.buyoutAmount) : '\u2014'}</td>
                  <td className={`${styles.tdRight} ${pkg.savings ? styles.positive : ''}`}>
                    {pkg.savings ? formatCurrency(pkg.savings) : '\u2014'}
                  </td>
                  <td className={styles.td}>{pkg.subcontractor || '\u2014'}</td>
                  <td className={styles.td}>{new Date(pkg.targetDate).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    <StatusBadge label={pkg.status} color={statusCfg.color} backgroundColor={statusCfg.bg} />
                  </td>
                </tr>
              );
            })}
            <tr className={styles.totalRow}>
              <td className={styles.td}>Total</td>
              <td className={styles.td} />
              <td className={styles.tdRight}>{formatCurrency(totalBudget)}</td>
              <td className={styles.tdRight}>{formatCurrency(totalBuyout)}</td>
              <td className={`${styles.tdRight} ${styles.positive}`}>{formatCurrency(totalSavings)}</td>
              <td className={styles.td} />
              <td className={styles.td} />
              <td className={styles.td} />
            </tr>
          </tbody>
        </table>
      </HbcCard>
    </div>
  );
};
