import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

type OverallRating = 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';

interface IScorecardEntry {
  id: string;
  subcontractor: string;
  trade: string;
  safety: number;
  quality: number;
  schedule: number;
  cooperation: number;
  overall: number;
  rating: OverallRating;
  lastReviewed: string;
}

const MOCK_SCORECARDS: IScorecardEntry[] = [
  { id: 'sc-1', subcontractor: 'Atlas Steel Fabricators', trade: 'Structural Steel', safety: 95, quality: 92, schedule: 88, cooperation: 90, overall: 91, rating: 'Excellent', lastReviewed: '2026-02-15' },
  { id: 'sc-2', subcontractor: 'Coastal Mechanical Inc.', trade: 'HVAC', safety: 90, quality: 88, schedule: 85, cooperation: 92, overall: 89, rating: 'Good', lastReviewed: '2026-02-15' },
  { id: 'sc-3', subcontractor: 'PowerLine Electric', trade: 'Electrical', safety: 88, quality: 90, schedule: 82, cooperation: 85, overall: 86, rating: 'Good', lastReviewed: '2026-02-15' },
  { id: 'sc-4', subcontractor: 'Southeast Plumbing Co.', trade: 'Plumbing', safety: 85, quality: 80, schedule: 78, cooperation: 82, overall: 81, rating: 'Good', lastReviewed: '2026-02-15' },
  { id: 'sc-5', subcontractor: 'Palm Beach Concrete', trade: 'Concrete', safety: 82, quality: 85, schedule: 90, cooperation: 88, overall: 86, rating: 'Good', lastReviewed: '2026-02-10' },
  { id: 'sc-6', subcontractor: 'Sunshine Roofing Corp.', trade: 'Roofing', safety: 78, quality: 75, schedule: 70, cooperation: 72, overall: 74, rating: 'Satisfactory', lastReviewed: '2026-02-10' },
  { id: 'sc-7', subcontractor: 'Precision Drywall LLC', trade: 'Drywall & Framing', safety: 70, quality: 68, schedule: 65, cooperation: 60, overall: 66, rating: 'Needs Improvement', lastReviewed: '2026-02-10' },
];

const RATING_CONFIG: Record<OverallRating, { color: string; bg: string }> = {
  'Excellent': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Good': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Satisfactory': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Needs Improvement': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'Poor': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return HBC_COLORS.success;
  if (score >= 80) return HBC_COLORS.info;
  if (score >= 70) return HBC_COLORS.warning;
  return HBC_COLORS.error;
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
  thCenter: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'center' as const,
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
  tdCenter: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    textAlign: 'center' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  scorePill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('10px'),
    fontSize: '12px',
    fontWeight: '600',
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  legendDot: {
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
  },
  categoryCard: {
    display: 'grid',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('8px'),
  },
  categoryTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  categoryAvg: {
    fontSize: '24px',
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const PHSubScorecardPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const avgOverall = Math.round(MOCK_SCORECARDS.reduce((sum, s) => sum + s.overall, 0) / MOCK_SCORECARDS.length);
  const avgSafety = Math.round(MOCK_SCORECARDS.reduce((sum, s) => sum + s.safety, 0) / MOCK_SCORECARDS.length);
  const avgQuality = Math.round(MOCK_SCORECARDS.reduce((sum, s) => sum + s.quality, 0) / MOCK_SCORECARDS.length);
  const avgSchedule = Math.round(MOCK_SCORECARDS.reduce((sum, s) => sum + s.schedule, 0) / MOCK_SCORECARDS.length);
  const avgCooperation = Math.round(MOCK_SCORECARDS.reduce((sum, s) => sum + s.cooperation, 0) / MOCK_SCORECARDS.length);
  const excellentCount = MOCK_SCORECARDS.filter(s => s.rating === 'Excellent').length;
  const needsImprovementCount = MOCK_SCORECARDS.filter(s => s.rating === 'Needs Improvement' || s.rating === 'Poor').length;

  const ScorePill: React.FC<{ score: number }> = ({ score }) => (
    <span
      className={styles.scorePill}
      style={{ color: getScoreColor(score), backgroundColor: `${getScoreColor(score)}18` }}
    >
      {score}
    </span>
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title="Subcontractor Scorecard"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Avg. Overall Score"
          value={avgOverall}
          subtitle={`${MOCK_SCORECARDS.length} subs rated`}
        />
        <KPICard
          title="Excellent Performers"
          value={excellentCount}
          subtitle="Score 90+"
          trend={{ value: 14, isPositive: true }}
        />
        <KPICard
          title="Needs Improvement"
          value={needsImprovementCount}
          subtitle="Score below 70"
        />
        <KPICard
          title="Last Review Period"
          value="Feb 2026"
          subtitle="Monthly assessment"
        />
      </div>

      <div className={styles.categoryGrid}>
        {[
          { title: 'Safety', avg: avgSafety, desc: 'OSHA compliance, toolbox talks, incident rate' },
          { title: 'Quality', avg: avgQuality, desc: 'Workmanship, deficiency rate, punch list items' },
          { title: 'Schedule', avg: avgSchedule, desc: 'On-time completion, resource availability' },
          { title: 'Cooperation', avg: avgCooperation, desc: 'Communication, coordination, responsiveness' },
        ].map((cat) => (
          <div key={cat.title} className={styles.categoryCard}>
            <span className={styles.categoryTitle}>{cat.title}</span>
            <span className={styles.categoryAvg} style={{ color: getScoreColor(cat.avg) }}>{cat.avg}</span>
            <span className={styles.categoryDesc}>{cat.desc}</span>
          </div>
        ))}
      </div>

      <HbcCard title="Scorecard Detail" subtitle="Individual subcontractor performance ratings">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Subcontractor</th>
              <th className={styles.th}>Trade</th>
              <th className={styles.thCenter}>Safety</th>
              <th className={styles.thCenter}>Quality</th>
              <th className={styles.thCenter}>Schedule</th>
              <th className={styles.thCenter}>Cooperation</th>
              <th className={styles.thCenter}>Overall</th>
              <th className={styles.th}>Rating</th>
              <th className={styles.th}>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SCORECARDS.map((entry) => {
              const ratingCfg = RATING_CONFIG[entry.rating];
              return (
                <tr key={entry.id}>
                  <td className={styles.td} style={{ fontWeight: tokens.fontWeightSemibold as string }}>{entry.subcontractor}</td>
                  <td className={styles.td}>{entry.trade}</td>
                  <td className={styles.tdCenter}><ScorePill score={entry.safety} /></td>
                  <td className={styles.tdCenter}><ScorePill score={entry.quality} /></td>
                  <td className={styles.tdCenter}><ScorePill score={entry.schedule} /></td>
                  <td className={styles.tdCenter}><ScorePill score={entry.cooperation} /></td>
                  <td className={styles.tdCenter}><ScorePill score={entry.overall} /></td>
                  <td className={styles.td}>
                    <StatusBadge label={entry.rating} color={ratingCfg.color} backgroundColor={ratingCfg.bg} />
                  </td>
                  <td className={styles.td}>{new Date(entry.lastReviewed).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HbcCard>

      <HbcCard title="Scoring Legend" subtitle="Performance rating thresholds">
        <div className={styles.legendGrid}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: HBC_COLORS.success }} />
            <span className={styles.legendLabel}>90-100: Excellent</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: HBC_COLORS.info }} />
            <span className={styles.legendLabel}>80-89: Good</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: HBC_COLORS.warning }} />
            <span className={styles.legendLabel}>70-79: Satisfactory</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: HBC_COLORS.error }} />
            <span className={styles.legendLabel}>Below 70: Needs Improvement</span>
          </div>
        </div>
      </HbcCard>
    </div>
  );
};
