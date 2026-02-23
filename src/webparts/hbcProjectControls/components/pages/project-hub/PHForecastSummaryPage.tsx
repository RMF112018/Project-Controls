import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  ArrowTrending24Regular,
  Money24Regular,
  DocumentBulletList24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

interface ICostLineItem {
  category: string;
  originalBudget: number;
  approvedChanges: number;
  revisedBudget: number;
  costToDate: number;
  projectedFinal: number;
  variance: number;
}

const MOCK_COST_LINES: ICostLineItem[] = [
  {
    category: 'General Conditions',
    originalBudget: 1_450_000,
    approvedChanges: 85_000,
    revisedBudget: 1_535_000,
    costToDate: 892_000,
    projectedFinal: 1_510_000,
    variance: 25_000,
  },
  {
    category: 'Site Work',
    originalBudget: 2_100_000,
    approvedChanges: 120_000,
    revisedBudget: 2_220_000,
    costToDate: 1_680_000,
    projectedFinal: 2_195_000,
    variance: 25_000,
  },
  {
    category: 'Concrete',
    originalBudget: 3_200_000,
    approvedChanges: 245_000,
    revisedBudget: 3_445_000,
    costToDate: 2_890_000,
    projectedFinal: 3_420_000,
    variance: 25_000,
  },
  {
    category: 'Structural Steel',
    originalBudget: 2_800_000,
    approvedChanges: 0,
    revisedBudget: 2_800_000,
    costToDate: 1_120_000,
    projectedFinal: 2_850_000,
    variance: -50_000,
  },
  {
    category: 'MEP',
    originalBudget: 4_500_000,
    approvedChanges: 180_000,
    revisedBudget: 4_680_000,
    costToDate: 2_340_000,
    projectedFinal: 4_650_000,
    variance: 30_000,
  },
  {
    category: 'Finishes',
    originalBudget: 1_950_000,
    approvedChanges: 60_000,
    revisedBudget: 2_010_000,
    costToDate: 780_000,
    projectedFinal: 2_000_000,
    variance: 10_000,
  },
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('16px'),
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  value: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

export const PHForecastSummaryPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const totals = MOCK_COST_LINES.reduce(
    (acc, line) => ({
      originalBudget: acc.originalBudget + line.originalBudget,
      approvedChanges: acc.approvedChanges + line.approvedChanges,
      revisedBudget: acc.revisedBudget + line.revisedBudget,
      costToDate: acc.costToDate + line.costToDate,
      projectedFinal: acc.projectedFinal + line.projectedFinal,
      variance: acc.variance + line.variance,
    }),
    { originalBudget: 0, approvedChanges: 0, revisedBudget: 0, costToDate: 0, projectedFinal: 0, variance: 0 },
  );

  const projectedProfit = totals.revisedBudget - totals.projectedFinal + totals.variance;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Forecast Summary"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Original Contract"
          value={formatCurrency(totals.originalBudget)}
          icon={<Money24Regular />}
        />
        <KPICard
          title="Approved Changes"
          value={formatCurrency(totals.approvedChanges)}
          subtitle={`${MOCK_COST_LINES.filter(l => l.approvedChanges > 0).length} categories with changes`}
          icon={<DocumentBulletList24Regular />}
        />
        <KPICard
          title="Revised Contract"
          value={formatCurrency(totals.revisedBudget)}
          icon={<Money24Regular />}
        />
        <KPICard
          title="Cost to Date"
          value={formatCurrency(totals.costToDate)}
          subtitle={`${Math.round((totals.costToDate / totals.revisedBudget) * 100)}% of revised budget`}
        />
        <KPICard
          title="Projected Final Cost"
          value={formatCurrency(totals.projectedFinal)}
          trend={{ value: 1.4, isPositive: true }}
          icon={<ArrowTrending24Regular />}
        />
        <KPICard
          title="Projected Profit/Loss"
          value={formatCurrency(projectedProfit)}
          subtitle={projectedProfit >= 0 ? 'Favorable' : 'Unfavorable'}
        />
      </div>

      <HbcCard title="Cost Breakdown by Category" subtitle="Budget vs. projected final cost">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Category</th>
              <th className={styles.thRight}>Original Budget</th>
              <th className={styles.thRight}>Approved Changes</th>
              <th className={styles.thRight}>Revised Budget</th>
              <th className={styles.thRight}>Cost to Date</th>
              <th className={styles.thRight}>Projected Final</th>
              <th className={styles.thRight}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COST_LINES.map((line) => (
              <tr key={line.category}>
                <td className={styles.td}>{line.category}</td>
                <td className={styles.tdRight}>{formatCurrency(line.originalBudget)}</td>
                <td className={styles.tdRight}>{formatCurrency(line.approvedChanges)}</td>
                <td className={styles.tdRight}>{formatCurrency(line.revisedBudget)}</td>
                <td className={styles.tdRight}>{formatCurrency(line.costToDate)}</td>
                <td className={styles.tdRight}>{formatCurrency(line.projectedFinal)}</td>
                <td className={`${styles.tdRight} ${line.variance >= 0 ? styles.positive : styles.negative}`}>
                  {line.variance >= 0 ? '+' : ''}{formatCurrency(line.variance)}
                </td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td className={styles.td}>Total</td>
              <td className={styles.tdRight}>{formatCurrency(totals.originalBudget)}</td>
              <td className={styles.tdRight}>{formatCurrency(totals.approvedChanges)}</td>
              <td className={styles.tdRight}>{formatCurrency(totals.revisedBudget)}</td>
              <td className={styles.tdRight}>{formatCurrency(totals.costToDate)}</td>
              <td className={styles.tdRight}>{formatCurrency(totals.projectedFinal)}</td>
              <td className={`${styles.tdRight} ${totals.variance >= 0 ? styles.positive : styles.negative}`}>
                {totals.variance >= 0 ? '+' : ''}{formatCurrency(totals.variance)}
              </td>
            </tr>
          </tbody>
        </table>
      </HbcCard>

      <div className={styles.summaryGrid}>
        <HbcCard title="Forecast Details" subtitle="Current period information">
          <div className={styles.infoRow}>
            <span className={styles.label}>Forecast Period</span>
            <span className={styles.value}>February 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Prepared By</span>
            <span className={styles.value}>Mike Thompson, PM</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Review Status</span>
            <span className={styles.value}>Pending PX Review</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Last Updated</span>
            <span className={styles.value}>Feb 20, 2026</span>
          </div>
        </HbcCard>

        <HbcCard title="Key Assumptions" subtitle="Factors influencing current projections">
          <div className={styles.infoRow}>
            <span className={styles.label}>Material Escalation</span>
            <span className={styles.value}>3.2% annual</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Labor Rate Increase</span>
            <span className={styles.value}>2.8% annual</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Contingency Remaining</span>
            <span className={styles.value}>$185,000</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Weather Days Used</span>
            <span className={styles.value}>4 of 12 allowed</span>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
