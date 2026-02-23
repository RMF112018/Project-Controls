import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

interface ICriterion {
  category: string;
  weight: number;
  score: number;
  maxScore: number;
  status: 'Pass' | 'Fail' | 'Review';
}

const MOCK_CRITERIA: ICriterion[] = [
  { category: 'Client Relationship', weight: 15, score: 13, maxScore: 15, status: 'Pass' },
  { category: 'Project Complexity', weight: 12, score: 9, maxScore: 12, status: 'Pass' },
  { category: 'Market Conditions', weight: 10, score: 7, maxScore: 10, status: 'Review' },
  { category: 'Estimating Capacity', weight: 10, score: 8, maxScore: 10, status: 'Pass' },
  { category: 'Financial Risk', weight: 15, score: 10, maxScore: 15, status: 'Review' },
  { category: 'Schedule Feasibility', weight: 12, score: 11, maxScore: 12, status: 'Pass' },
  { category: 'Safety Considerations', weight: 10, score: 10, maxScore: 10, status: 'Pass' },
  { category: 'Bonding / Insurance', weight: 8, score: 6, maxScore: 8, status: 'Pass' },
  { category: 'Strategic Value', weight: 8, score: 5, maxScore: 8, status: 'Review' },
];

const statusColorMap: Record<string, { color: string; backgroundColor: string }> = {
  Pass: { color: HBC_COLORS.success, backgroundColor: HBC_COLORS.successLight },
  Fail: { color: HBC_COLORS.error, backgroundColor: HBC_COLORS.errorLight },
  Review: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
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
  criteriaTable: {
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
  tableCell: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  scoreTrack: {
    flexGrow: 1,
    height: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('3px'),
    ...shorthands.overflow('hidden'),
  },
  scoreFill: {
    height: '100%',
    ...shorthands.borderRadius('3px'),
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  infoLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  infoValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

export const PHGoNoGoPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Go / No-Go Scorecard" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the Go/No-Go evaluation."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';
  const totalScore = MOCK_CRITERIA.reduce((sum, c) => sum + c.score, 0);
  const maxScore = MOCK_CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Go / No-Go Scorecard"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Total Score" value={`${totalScore} / ${maxScore}`} subtitle={`${percentage}%`} />
        <KPICard title="Decision" value="Pending" subtitle="Awaiting committee review" />
        <KPICard title="Criteria Evaluated" value={String(MOCK_CRITERIA.length)} />
        <KPICard title="Items Requiring Review" value={String(MOCK_CRITERIA.filter(c => c.status === 'Review').length)} />
      </div>

      <HbcCard title="Evaluation Criteria">
        <table className={styles.criteriaTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Category</th>
              <th className={styles.tableHeader}>Weight</th>
              <th className={styles.tableHeader}>Score</th>
              <th className={styles.tableHeader}>Progress</th>
              <th className={styles.tableHeader}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CRITERIA.map((criterion) => {
              const pct = Math.round((criterion.score / criterion.maxScore) * 100);
              const barColor = criterion.status === 'Pass' ? HBC_COLORS.success
                : criterion.status === 'Fail' ? HBC_COLORS.error
                : HBC_COLORS.warning;
              const colors = statusColorMap[criterion.status] || statusColorMap.Review;
              return (
                <tr key={criterion.category}>
                  <td className={styles.tableCell}>{criterion.category}</td>
                  <td className={styles.tableCell}>{criterion.weight}%</td>
                  <td className={styles.tableCell}>{criterion.score} / {criterion.maxScore}</td>
                  <td className={styles.tableCell}>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreTrack}>
                        <div
                          className={styles.scoreFill}
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, minWidth: '32px' }}>{pct}%</span>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <StatusBadge label={criterion.status} color={colors.color} backgroundColor={colors.backgroundColor} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HbcCard>

      <div className={styles.sectionGrid}>
        <HbcCard title="Committee Notes">
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Meeting Date</span>
            <span className={styles.infoValue}>Not scheduled</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Attendees</span>
            <span className={styles.infoValue}>{'\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Recommendation</span>
            <span className={styles.infoValue}>Pending</span>
          </div>
        </HbcCard>

        <HbcCard title="Risk Summary">
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Highest Risk Factor</span>
            <span className={styles.infoValue}>Financial Risk</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Mitigation Plan</span>
            <span className={styles.infoValue}>In development</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Bonding Status</span>
            <span className={styles.infoValue}>Pre-qualified</span>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
