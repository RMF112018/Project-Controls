import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

interface IGCGRLineItem {
  code: string;
  description: string;
  monthlyBudget: number;
  totalBudget: number;
  actualToDate: number;
  projectedFinal: number;
  variance: number;
}

const MOCK_GC_ITEMS: IGCGRLineItem[] = [
  { code: 'GC-01', description: 'Project Management Staff', monthlyBudget: 45_000, totalBudget: 810_000, actualToDate: 495_000, projectedFinal: 800_000, variance: 10_000 },
  { code: 'GC-02', description: 'Field Supervision', monthlyBudget: 38_000, totalBudget: 684_000, actualToDate: 418_000, projectedFinal: 690_000, variance: -6_000 },
  { code: 'GC-03', description: 'Temporary Facilities', monthlyBudget: 8_500, totalBudget: 153_000, actualToDate: 93_500, projectedFinal: 148_000, variance: 5_000 },
  { code: 'GC-04', description: 'Equipment & Small Tools', monthlyBudget: 12_000, totalBudget: 216_000, actualToDate: 132_000, projectedFinal: 220_000, variance: -4_000 },
  { code: 'GC-05', description: 'Temporary Utilities', monthlyBudget: 6_200, totalBudget: 111_600, actualToDate: 68_200, projectedFinal: 108_000, variance: 3_600 },
  { code: 'GC-06', description: 'Safety & Protection', monthlyBudget: 4_800, totalBudget: 86_400, actualToDate: 52_800, projectedFinal: 84_000, variance: 2_400 },
  { code: 'GC-07', description: 'Cleanup & Waste Removal', monthlyBudget: 7_500, totalBudget: 135_000, actualToDate: 82_500, projectedFinal: 138_000, variance: -3_000 },
  { code: 'GC-08', description: 'Insurance & Bonds', monthlyBudget: 0, totalBudget: 245_000, actualToDate: 245_000, projectedFinal: 245_000, variance: 0 },
];

const MOCK_GR_ITEMS: IGCGRLineItem[] = [
  { code: 'GR-01', description: 'Permits & Fees', monthlyBudget: 0, totalBudget: 185_000, actualToDate: 178_500, projectedFinal: 185_000, variance: 0 },
  { code: 'GR-02', description: 'Testing & Inspections', monthlyBudget: 5_000, totalBudget: 90_000, actualToDate: 55_000, projectedFinal: 92_000, variance: -2_000 },
  { code: 'GR-03', description: 'Survey & Layout', monthlyBudget: 3_200, totalBudget: 57_600, actualToDate: 35_200, projectedFinal: 55_000, variance: 2_600 },
  { code: 'GR-04', description: 'As-Built Documentation', monthlyBudget: 2_000, totalBudget: 36_000, actualToDate: 22_000, projectedFinal: 36_000, variance: 0 },
];

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
  totalRow: {
    fontWeight: tokens.fontWeightBold,
    backgroundColor: HBC_COLORS.gray50,
  },
  positive: {
    color: HBC_COLORS.success,
  },
  negative: {
    color: HBC_COLORS.error,
  },
  progressCell: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: HBC_COLORS.gray200,
    ...shorthands.borderRadius('3px'),
    ...shorthands.overflow('hidden'),
  },
  progressFill: {
    height: '100%',
    ...shorthands.borderRadius('3px'),
  },
});

const sumItems = (items: IGCGRLineItem[]): { totalBudget: number; actualToDate: number; projectedFinal: number; variance: number } =>
  items.reduce(
    (acc, item) => ({
      totalBudget: acc.totalBudget + item.totalBudget,
      actualToDate: acc.actualToDate + item.actualToDate,
      projectedFinal: acc.projectedFinal + item.projectedFinal,
      variance: acc.variance + item.variance,
    }),
    { totalBudget: 0, actualToDate: 0, projectedFinal: 0, variance: 0 },
  );

const CostTable: React.FC<{
  items: IGCGRLineItem[];
  styles: ReturnType<typeof useStyles>;
}> = ({ items, styles: s }) => {
  const totals = sumItems(items);
  return (
    <table className={s.table}>
      <thead className={s.tableHead}>
        <tr>
          <th className={s.th}>Code</th>
          <th className={s.th}>Description</th>
          <th className={s.thRight}>Total Budget</th>
          <th className={s.thRight}>Actual to Date</th>
          <th className={s.thRight}>Projected Final</th>
          <th className={s.thRight}>Variance</th>
          <th className={s.th}>% Used</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const pct = item.totalBudget > 0 ? Math.round((item.actualToDate / item.totalBudget) * 100) : 0;
          const barColor = pct > 90 ? HBC_COLORS.error : pct > 75 ? HBC_COLORS.warning : HBC_COLORS.success;
          return (
            <tr key={item.code}>
              <td className={s.tdCode}>{item.code}</td>
              <td className={s.td}>{item.description}</td>
              <td className={s.tdRight}>{formatCurrency(item.totalBudget)}</td>
              <td className={s.tdRight}>{formatCurrency(item.actualToDate)}</td>
              <td className={s.tdRight}>{formatCurrency(item.projectedFinal)}</td>
              <td className={`${s.tdRight} ${item.variance >= 0 ? s.positive : s.negative}`}>
                {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
              </td>
              <td className={s.progressCell}>
                <div className={s.progressTrack}>
                  <div
                    className={s.progressFill}
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                  />
                </div>
              </td>
            </tr>
          );
        })}
        <tr className={s.totalRow}>
          <td className={s.td} />
          <td className={s.td}>Subtotal</td>
          <td className={s.tdRight}>{formatCurrency(totals.totalBudget)}</td>
          <td className={s.tdRight}>{formatCurrency(totals.actualToDate)}</td>
          <td className={s.tdRight}>{formatCurrency(totals.projectedFinal)}</td>
          <td className={`${s.tdRight} ${totals.variance >= 0 ? s.positive : s.negative}`}>
            {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
          </td>
          <td className={s.td} />
        </tr>
      </tbody>
    </table>
  );
};

export const PHGCGRForecastPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const gcTotals = sumItems(MOCK_GC_ITEMS);
  const grTotals = sumItems(MOCK_GR_ITEMS);
  const grandTotal = {
    totalBudget: gcTotals.totalBudget + grTotals.totalBudget,
    actualToDate: gcTotals.actualToDate + grTotals.actualToDate,
    projectedFinal: gcTotals.projectedFinal + grTotals.projectedFinal,
    variance: gcTotals.variance + grTotals.variance,
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="GC/GR Forecast"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="GC/GR Total Budget"
          value={formatCurrency(grandTotal.totalBudget)}
        />
        <KPICard
          title="Actual to Date"
          value={formatCurrency(grandTotal.actualToDate)}
          subtitle={`${Math.round((grandTotal.actualToDate / grandTotal.totalBudget) * 100)}% spent`}
        />
        <KPICard
          title="Projected Final"
          value={formatCurrency(grandTotal.projectedFinal)}
        />
        <KPICard
          title="Total Variance"
          value={`${grandTotal.variance >= 0 ? '+' : ''}${formatCurrency(grandTotal.variance)}`}
          subtitle={grandTotal.variance >= 0 ? 'Under budget' : 'Over budget'}
          trend={{ value: 0.3, isPositive: grandTotal.variance >= 0 }}
        />
      </div>

      <HbcCard title="General Conditions (GC)" subtitle="Project management and field overhead costs">
        <CostTable items={MOCK_GC_ITEMS} styles={styles} />
      </HbcCard>

      <HbcCard title="General Requirements (GR)" subtitle="Regulatory, testing, and documentation costs">
        <CostTable items={MOCK_GR_ITEMS} styles={styles} />
      </HbcCard>
    </div>
  );
};
