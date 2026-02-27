import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { formatCurrency, type ICashFlowMonth } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_CASH_FLOW: ICashFlowMonth[] = [
  { month: 'Jan 2026', billingProjection: 980_000, expenditureForecast: 1_050_000, netCashFlow: -70_000, cumulativeCash: -70_000 },
  { month: 'Feb 2026', billingProjection: 1_250_000, expenditureForecast: 1_180_000, netCashFlow: 70_000, cumulativeCash: 0 },
  { month: 'Mar 2026', billingProjection: 1_450_000, expenditureForecast: 1_320_000, netCashFlow: 130_000, cumulativeCash: 130_000 },
  { month: 'Apr 2026', billingProjection: 1_680_000, expenditureForecast: 1_520_000, netCashFlow: 160_000, cumulativeCash: 290_000 },
  { month: 'May 2026', billingProjection: 1_820_000, expenditureForecast: 1_750_000, netCashFlow: 70_000, cumulativeCash: 360_000 },
  { month: 'Jun 2026', billingProjection: 1_950_000, expenditureForecast: 1_880_000, netCashFlow: 70_000, cumulativeCash: 430_000 },
  { month: 'Jul 2026', billingProjection: 1_750_000, expenditureForecast: 1_900_000, netCashFlow: -150_000, cumulativeCash: 280_000 },
  { month: 'Aug 2026', billingProjection: 1_420_000, expenditureForecast: 1_350_000, netCashFlow: 70_000, cumulativeCash: 350_000 },
  { month: 'Sep 2026', billingProjection: 1_100_000, expenditureForecast: 980_000, netCashFlow: 120_000, cumulativeCash: 470_000 },
  { month: 'Oct 2026', billingProjection: 850_000, expenditureForecast: 720_000, netCashFlow: 130_000, cumulativeCash: 600_000 },
  { month: 'Nov 2026', billingProjection: 520_000, expenditureForecast: 480_000, netCashFlow: 40_000, cumulativeCash: 640_000 },
  { month: 'Dec 2026', billingProjection: 380_000, expenditureForecast: 320_000, netCashFlow: 60_000, cumulativeCash: 700_000 },
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
    fontWeight: tokens.fontWeightSemibold,
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
  currentMonth: {
    backgroundColor: HBC_COLORS.infoLight,
  },
  barCell: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    height: '20px',
  },
  bar: {
    height: '14px',
    ...shorthands.borderRadius('3px'),
    minWidth: '2px',
  },
  barLabel: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
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

export const PHCashFlowForecastPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const totalBilling = MOCK_CASH_FLOW.reduce((sum, m) => sum + m.billingProjection, 0);
  const totalExpenditure = MOCK_CASH_FLOW.reduce((sum, m) => sum + m.expenditureForecast, 0);
  const maxBilling = Math.max(...MOCK_CASH_FLOW.map(m => m.billingProjection));
  const peakMonth = MOCK_CASH_FLOW.reduce((max, m) => m.billingProjection > max.billingProjection ? m : max);
  const finalCumulative = MOCK_CASH_FLOW[MOCK_CASH_FLOW.length - 1].cumulativeCash;

  const currentMonthIndex = 1; // February 2026

  return (
    <div className={styles.container}>
      <PageHeader
        title="Cash Flow Forecast"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Projected Billing"
          value={formatCurrency(totalBilling)}
        />
        <KPICard
          title="Total Projected Expenditure"
          value={formatCurrency(totalExpenditure)}
        />
        <KPICard
          title="Net Cash Position (EOY)"
          value={formatCurrency(finalCumulative)}
          trend={{ value: 4.2, isPositive: true }}
        />
        <KPICard
          title="Peak Billing Month"
          value={peakMonth.month}
          subtitle={formatCurrency(peakMonth.billingProjection)}
        />
      </div>

      <HbcCard title="Monthly Cash Flow Projection" subtitle="Billing vs. expenditure by month">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Month</th>
              <th className={styles.thRight}>Billing Projection</th>
              <th className={styles.thRight}>Expenditure Forecast</th>
              <th className={styles.thRight}>Net Cash Flow</th>
              <th className={styles.thRight}>Cumulative Cash</th>
              <th className={styles.th}>Billing Volume</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CASH_FLOW.map((month, index) => {
              const barWidth = maxBilling > 0 ? Math.round((month.billingProjection / maxBilling) * 100) : 0;
              return (
                <tr key={month.month} className={index === currentMonthIndex ? styles.currentMonth : undefined}>
                  <td className={styles.td}>{month.month}</td>
                  <td className={styles.tdRight}>{formatCurrency(month.billingProjection)}</td>
                  <td className={styles.tdRight}>{formatCurrency(month.expenditureForecast)}</td>
                  <td className={`${styles.tdRight} ${month.netCashFlow >= 0 ? styles.positive : styles.negative}`}>
                    {month.netCashFlow >= 0 ? '+' : ''}{formatCurrency(month.netCashFlow)}
                  </td>
                  <td className={`${styles.tdRight} ${month.cumulativeCash >= 0 ? styles.positive : styles.negative}`}>
                    {formatCurrency(month.cumulativeCash)}
                  </td>
                  <td className={styles.barCell}>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: HBC_COLORS.info,
                        }}
                      />
                      <span className={styles.barLabel}>{barWidth}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className={styles.totalRow}>
              <td className={styles.td}>Total</td>
              <td className={styles.tdRight}>{formatCurrency(totalBilling)}</td>
              <td className={styles.tdRight}>{formatCurrency(totalExpenditure)}</td>
              <td className={`${styles.tdRight} ${(totalBilling - totalExpenditure) >= 0 ? styles.positive : styles.negative}`}>
                {(totalBilling - totalExpenditure) >= 0 ? '+' : ''}{formatCurrency(totalBilling - totalExpenditure)}
              </td>
              <td className={styles.tdRight}>{formatCurrency(finalCumulative)}</td>
              <td className={styles.td} />
            </tr>
          </tbody>
        </table>
      </HbcCard>

      <div className={styles.summaryGrid}>
        <HbcCard title="Billing Terms" subtitle="Owner payment schedule details">
          <div className={styles.infoRow}>
            <span className={styles.label}>Payment Terms</span>
            <span className={styles.value}>Net 30</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Retainage</span>
            <span className={styles.value}>10% to 50%, 5% thereafter</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Billing Cutoff</span>
            <span className={styles.value}>25th of each month</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Retainage Held</span>
            <span className={styles.value}>{formatCurrency(485_000)}</span>
          </div>
        </HbcCard>

        <HbcCard title="Cash Flow Risks" subtitle="Items that may impact projections">
          <div className={styles.infoRow}>
            <span className={styles.label}>Pending Change Orders</span>
            <span className={styles.value}>{formatCurrency(320_000)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Disputed Invoices</span>
            <span className={styles.value}>{formatCurrency(45_000)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Acceleration Risk</span>
            <span className={styles.value}>Low</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Owner Payment History</span>
            <span className={styles.value}>Avg. 35 days</span>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
