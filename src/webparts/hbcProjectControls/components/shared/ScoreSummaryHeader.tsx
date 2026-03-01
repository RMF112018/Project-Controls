/**
 * Phase 2 (GNG Plan) — Score Summary Header.
 *
 * KPI card grid showing originator/committee totals, difference,
 * completion percentages, and recommended decision.
 *
 * Consumes IGoNoGoTotals from useCalculateGoNoGoTotals.
 */
import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { IGoNoGoScorecard } from '@hbc/sp-services';
import { ScorecardStatus } from '@hbc/sp-services';
import type { IGoNoGoTotals } from '../../tanstack/query/mutations/useGoNoGoMutation';
import { StatusBadge } from './StatusBadge';
import { HBC_COLORS, SPACING } from '../../theme/tokens';

// ── Types ──────────────────────────────────────────────────────────────

export interface IScoreSummaryHeaderProps {
  scorecard: IGoNoGoScorecard | null;
  totals: IGoNoGoTotals;
  projectName?: string;
  clientName?: string;
}

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap(SPACING.md),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    ...shorthands.gap(SPACING.md),
  },
  kpiCard: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(SPACING.md),
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'grid',
    rowGap: tokens.spacingVerticalXS,
  },
  kpiLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  kpiValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightBase600,
  },
  kpiSub: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  progressBar: {
    height: '4px',
    ...shorthands.borderRadius('2px'),
    backgroundColor: tokens.colorNeutralStroke2,
    ...shorthands.overflow('hidden'),
    marginTop: tokens.spacingVerticalXXS,
  },
  progressFill: {
    height: '100%',
    ...shorthands.borderRadius('2px'),
    transitionProperty: 'width',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease',
  },
  projectInfo: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap(SPACING.sm),
  },
  projectName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  clientName: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
  differencePositive: {
    color: HBC_COLORS.scoreTierHigh,
  },
  differenceNegative: {
    color: HBC_COLORS.scoreTierLow,
  },
  differenceZero: {
    color: tokens.colorNeutralForeground3,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────

const STATUS_DISPLAY: Record<ScorecardStatus, { label: string; color: string; bg: string }> = {
  [ScorecardStatus.BDDraft]: { label: 'BD Draft', color: '#856404', bg: '#FFF3CD' },
  [ScorecardStatus.AwaitingDirectorReview]: { label: 'Awaiting Director', color: '#004085', bg: '#CCE5FF' },
  [ScorecardStatus.DirectorReturnedForRevision]: { label: 'Returned (Director)', color: '#856404', bg: '#FFF3CD' },
  [ScorecardStatus.AwaitingCommitteeScoring]: { label: 'Awaiting Committee', color: '#004085', bg: '#CCE5FF' },
  [ScorecardStatus.CommitteeReturnedForRevision]: { label: 'Returned (Committee)', color: '#856404', bg: '#FFF3CD' },
  [ScorecardStatus.Rejected]: { label: 'Rejected', color: '#721C24', bg: '#F8D7DA' },
  [ScorecardStatus.NoGo]: { label: 'No-Go', color: '#721C24', bg: '#F8D7DA' },
  [ScorecardStatus.Go]: { label: 'Go', color: '#155724', bg: '#D4EDDA' },
  [ScorecardStatus.Locked]: { label: 'Locked', color: '#383D41', bg: '#E2E3E5' },
  [ScorecardStatus.Unlocked]: { label: 'Unlocked', color: '#004085', bg: '#CCE5FF' },
};

function formatDifference(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return String(diff);
  return '0';
}

// ── Component ──────────────────────────────────────────────────────────

export const ScoreSummaryHeader: React.FC<IScoreSummaryHeaderProps> = React.memo(({
  scorecard,
  totals,
  projectName,
  clientName,
}) => {
  const styles = useStyles();

  const statusDisplay = scorecard
    ? STATUS_DISPLAY[scorecard.scorecardStatus] ?? STATUS_DISPLAY[ScorecardStatus.BDDraft]
    : null;

  const diffClass = totals.difference > 0
    ? styles.differencePositive
    : totals.difference < 0
      ? styles.differenceNegative
      : styles.differenceZero;

  return (
    <div className={styles.root}>
      {/* Project info bar */}
      {(projectName || clientName || statusDisplay) && (
        <div className={styles.projectInfo}>
          {projectName && <span className={styles.projectName}>{projectName}</span>}
          {clientName && <span className={styles.clientName}>{clientName}</span>}
          {statusDisplay && (
            <StatusBadge
              label={statusDisplay.label}
              color={statusDisplay.color}
              backgroundColor={statusDisplay.bg}
              size="medium"
            />
          )}
          {scorecard?.Decision && (
            <StatusBadge
              label={scorecard.Decision}
              color={scorecard.Decision === 'Go' ? '#155724' : '#721C24'}
              backgroundColor={scorecard.Decision === 'Go' ? '#D4EDDA' : '#F8D7DA'}
              size="medium"
            />
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        {/* Originator Score */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Originator Score</div>
          <div className={styles.kpiValue} style={{ color: totals.originatorColor }}>
            {totals.originatorTotal}
            <span style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}> / 92</span>
          </div>
          <div className={styles.kpiSub}>{totals.originatorLabel}</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${totals.originatorCompletionPct}%`,
                backgroundColor: totals.originatorColor,
              }}
            />
          </div>
          <div className={styles.kpiSub}>{Math.round(totals.originatorCompletionPct)}% scored</div>
        </div>

        {/* Committee Score */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Committee Score</div>
          <div className={styles.kpiValue} style={{ color: totals.committeeColor }}>
            {totals.committeeTotal}
            <span style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}> / 92</span>
          </div>
          <div className={styles.kpiSub}>{totals.committeeLabel}</div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${totals.committeeCompletionPct}%`,
                backgroundColor: totals.committeeColor,
              }}
            />
          </div>
          <div className={styles.kpiSub}>{Math.round(totals.committeeCompletionPct)}% scored</div>
        </div>

        {/* Difference */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Difference</div>
          <div className={mergeClasses(styles.kpiValue, diffClass)}>
            {formatDifference(totals.difference)}
          </div>
          <div className={styles.kpiSub}>Committee − Originator</div>
        </div>

        {/* Recommendation */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Recommendation</div>
          {totals.recommendedDecision ? (
            <>
              <div className={styles.kpiValue} style={{ color: totals.committeeColor }}>
                {totals.recommendedDecision.decision}
              </div>
              <div className={styles.kpiSub}>
                {totals.recommendedDecision.confidence} — {totals.recommendedDecision.reasoning}
              </div>
            </>
          ) : (
            <div className={styles.kpiSub}>Complete committee scores to see recommendation</div>
          )}
        </div>
      </div>
    </div>
  );
});
ScoreSummaryHeader.displayName = 'ScoreSummaryHeader';
