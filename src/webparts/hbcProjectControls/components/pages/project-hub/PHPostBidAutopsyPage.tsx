import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  formatCurrency,
  type IVarianceItem,
  type ProjectHubLessonLearned as ILessonLearned,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_VARIANCE: IVarianceItem[] = [
  { id: '1', division: 'Concrete', estimatedCost: 1200000, actualCost: 1340000, variance: -140000, variancePct: -11.7, notes: 'Labor rates higher than projected' },
  { id: '2', division: 'Structural Steel', estimatedCost: 1600000, actualCost: 1520000, variance: 80000, variancePct: 5.0, notes: 'Competitive market pricing' },
  { id: '3', division: 'Mechanical / HVAC', estimatedCost: 2850000, actualCost: 3100000, variance: -250000, variancePct: -8.8, notes: 'Specification changes during bid period' },
  { id: '4', division: 'Electrical', estimatedCost: 1920000, actualCost: 1890000, variance: 30000, variancePct: 1.6, notes: 'Within tolerance' },
  { id: '5', division: 'Site Work', estimatedCost: 270000, actualCost: 295000, variance: -25000, variancePct: -9.3, notes: 'Rock excavation underestimated' },
  { id: '6', division: 'Finishes', estimatedCost: 480000, actualCost: 465000, variance: 15000, variancePct: 3.1, notes: 'Value engineering savings' },
];

const MOCK_LESSONS: ILessonLearned[] = [
  { id: 'l1', category: 'Estimating', finding: 'Concrete labor rates were based on 12-month-old data', recommendation: 'Update labor rate database quarterly for active trades', impact: 'High' },
  { id: 'l2', category: 'Scope', finding: 'Mechanical scope changed after bid submission due to addendum', recommendation: 'Flag late addenda for estimate review within 24 hours', impact: 'High' },
  { id: 'l3', category: 'Market', finding: 'Steel prices dropped 8% between estimate and award', recommendation: 'Include market trend analysis in pre-bid report', impact: 'Medium' },
  { id: 'l4', category: 'Process', finding: 'Subcontractor bid coverage was only 58% at bid time', recommendation: 'Set minimum 75% sub coverage threshold 48 hours before bid', impact: 'Medium' },
  { id: 'l5', category: 'Estimating', finding: 'Geotechnical report not reviewed until late in estimating', recommendation: 'Add geotech review to Day 1 kickoff checklist', impact: 'Low' },
];

const impactColors: Record<string, { color: string; backgroundColor: string }> = {
  High: { color: HBC_COLORS.error, backgroundColor: HBC_COLORS.errorLight },
  Medium: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
  Low: { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
};

const categoryColors: Record<string, { color: string; backgroundColor: string }> = {
  Estimating: { color: HBC_COLORS.navy, backgroundColor: '#E0E7FF' },
  Scope: { color: '#7C3AED', backgroundColor: '#EDE9FE' },
  Market: { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
  Process: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
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
  varianceTable: {
    width: '100%',
    ...shorthands.borderRadius('4px'),
    ...shorthands.overflow('hidden'),
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    textAlign: 'left',
    ...shorthands.padding('10px', '12px'),
  },
  tableHeaderRight: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    textAlign: 'right',
    ...shorthands.padding('10px', '12px'),
  },
  tableCell: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  tableCellRight: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    textAlign: 'right',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    fontVariantNumeric: 'tabular-nums',
  },
  variancePositive: {
    color: HBC_COLORS.success,
    fontWeight: tokens.fontWeightSemibold,
  },
  varianceNegative: {
    color: HBC_COLORS.error,
    fontWeight: tokens.fontWeightSemibold,
  },
  lessonCard: {
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  lessonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    ...shorthands.gap('8px'),
  },
  lessonBadges: {
    display: 'flex',
    ...shorthands.gap('6px'),
    flexShrink: 0,
  },
  finding: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    marginBottom: '4px',
  },
  recommendation: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  recommendationLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
});

function formatVarianceCurrency(value: number): string {
  const absValue = Math.abs(value);
  const formatted = formatCurrency(absValue);
  return value < 0 ? `(${formatted})` : formatted;
}

export const PHPostBidAutopsyPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Post-Bid Analysis" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the post-bid analysis."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';
  const totalEstimated = MOCK_VARIANCE.reduce((sum, i) => sum + i.estimatedCost, 0);
  const totalActual = MOCK_VARIANCE.reduce((sum, i) => sum + i.actualCost, 0);
  const totalVariance = totalEstimated - totalActual;
  const totalVariancePct = ((totalVariance / totalEstimated) * 100).toFixed(1);
  const overBudgetCount = MOCK_VARIANCE.filter(i => i.variance < 0).length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Post-Bid Analysis"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Total Estimated" value={formatCurrency(totalEstimated)} />
        <KPICard title="Total Actual" value={formatCurrency(totalActual)} />
        <KPICard
          title="Net Variance"
          value={formatVarianceCurrency(totalVariance)}
          subtitle={`${totalVariancePct}%`}
          trend={{ value: Math.abs(parseFloat(totalVariancePct)), isPositive: totalVariance >= 0 }}
        />
        <KPICard title="Over Budget Items" value={String(overBudgetCount)} subtitle={`of ${MOCK_VARIANCE.length} divisions`} />
      </div>

      <HbcCard title="Cost Variance by Division">
        <table className={styles.varianceTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Division</th>
              <th className={styles.tableHeaderRight}>Estimated</th>
              <th className={styles.tableHeaderRight}>Actual</th>
              <th className={styles.tableHeaderRight}>Variance ($)</th>
              <th className={styles.tableHeaderRight}>Variance (%)</th>
              <th className={styles.tableHeader}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_VARIANCE.map(item => (
              <tr key={item.id}>
                <td className={styles.tableCell}>{item.division}</td>
                <td className={styles.tableCellRight}>{formatCurrency(item.estimatedCost)}</td>
                <td className={styles.tableCellRight}>{formatCurrency(item.actualCost)}</td>
                <td className={styles.tableCellRight}>
                  <span className={item.variance >= 0 ? styles.variancePositive : styles.varianceNegative}>
                    {formatVarianceCurrency(item.variance)}
                  </span>
                </td>
                <td className={styles.tableCellRight}>
                  <span className={item.variancePct >= 0 ? styles.variancePositive : styles.varianceNegative}>
                    {item.variancePct > 0 ? '+' : ''}{item.variancePct.toFixed(1)}%
                  </span>
                </td>
                <td className={styles.tableCell}>{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </HbcCard>

      <HbcCard title="Lessons Learned" subtitle={`${MOCK_LESSONS.length} findings documented`}>
        {MOCK_LESSONS.map(lesson => {
          const impactStyle = impactColors[lesson.impact] || impactColors.Low;
          const catStyle = categoryColors[lesson.category] || categoryColors.Process;
          return (
            <div key={lesson.id} className={styles.lessonCard}>
              <div className={styles.lessonHeader}>
                <div className={styles.finding}>{lesson.finding}</div>
                <div className={styles.lessonBadges}>
                  <StatusBadge label={lesson.category} color={catStyle.color} backgroundColor={catStyle.backgroundColor} />
                  <StatusBadge label={lesson.impact} color={impactStyle.color} backgroundColor={impactStyle.backgroundColor} />
                </div>
              </div>
              <div className={styles.recommendation}>
                <span className={styles.recommendationLabel}>Recommendation: </span>
                {lesson.recommendation}
              </div>
            </div>
          );
        })}
      </HbcCard>
    </div>
  );
};
