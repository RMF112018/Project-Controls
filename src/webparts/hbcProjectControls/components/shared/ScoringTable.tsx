/**
 * Phase 2 (GNG Plan) — 19-criteria × 2-scorer responsive scoring table.
 *
 * Renders all 19 Go/No-Go criteria from SCORECARD_CRITERIA (single source of truth)
 * with inline Fluent UI Select dropdowns for originator and committee scoring.
 *
 * Point values stored in IGoNoGoScorecard.scores as numeric values;
 * the table reverse-maps values to High/Average/Low labels for display.
 *
 * Responsive: full table on desktop, stacked cards on mobile (<768px).
 */
import * as React from 'react';
import { makeStyles, mergeClasses, Select, shorthands, tokens } from '@fluentui/react-components';
import {
  SCORECARD_CRITERIA,
  type IScorecardCriterion,
  type IGoNoGoScorecard,
  type IScorecardCriterionComment,
  type IScorecardCriterionMeta,
} from '@hbc/sp-services';
import { HBC_COLORS, BREAKPOINTS } from '../../theme/tokens';
import { CriterionCommentPopover } from './CriterionCommentPopover';
import { LastEditedAvatar } from './LastEditedAvatar';

// ── Types ──────────────────────────────────────────────────────────────

export interface IScoringTableProps {
  scores: IGoNoGoScorecard['scores'];
  onScoreChange: (criterionId: number, column: 'originator' | 'committee', value: number) => void;
  canEditOriginator: boolean;
  canEditCommittee: boolean;
  isUpdating: boolean;
  originatorTotal?: number;
  committeeTotal?: number;
  originatorColor?: string;
  committeeColor?: string;
  // Phase 3: Collaboration
  criterionComments?: IScorecardCriterionComment[];
  criterionMeta?: IScorecardCriterionMeta;
  currentUserEmail?: string;
  onAddComment?: (criterionId: number, text: string) => void;
  onEditComment?: (commentId: number, text: string) => void;
  onDeleteComment?: (commentId: number) => void;
  canComment?: boolean;
  isLocked?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

type ScoreLevel = 'High' | 'Average' | 'Low';

/** Reverse-map a numeric point value to its label for a given criterion. */
function getScoreLabel(criterion: IScorecardCriterion, value: number | undefined): ScoreLevel | '' {
  if (value === undefined) return '';
  if (value === criterion.high) return 'High';
  if (value === criterion.avg) return 'Average';
  if (value === criterion.low) return 'Low';
  return '';
}

/** Map a label to its point value for a given criterion. */
function getLabelValue(criterion: IScorecardCriterion, label: string): number | undefined {
  switch (label) {
    case 'High': return criterion.high;
    case 'Average': return criterion.avg;
    case 'Low': return criterion.low;
    default: return undefined;
  }
}

/** Point-value color: green for high, amber for avg, red for low. */
function getPointColor(criterion: IScorecardCriterion, value: number | undefined): string {
  if (value === undefined) return tokens.colorNeutralForeground4;
  if (value === criterion.high) return HBC_COLORS.scoreTierHigh;
  if (value === criterion.avg) return HBC_COLORS.scoreTierMid;
  return HBC_COLORS.scoreTierLow;
}

// ── Styles ─────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  tableWrapper: {
    ...shorthands.overflow('auto'),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  thead: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  th: {
    ...shorthands.padding(tokens.spacingVerticalSNudge, tokens.spacingHorizontalS),
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'left' as const,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
  },
  thNumber: {
    width: '32px',
    textAlign: 'center' as const,
  },
  thCriteria: {
    minWidth: '200px',
  },
  thScore: {
    width: '120px',
    textAlign: 'center' as const,
  },
  thPts: {
    width: '48px',
    textAlign: 'center' as const,
  },
  thComment: {
    width: '36px',
    textAlign: 'center' as const,
  },
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  trAlt: {
    backgroundColor: tokens.colorNeutralBackground2,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  td: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'middle',
  },
  tdNumber: {
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
  },
  tdLabel: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
  },
  tdPts: {
    textAlign: 'center' as const,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase300,
  },
  tdPtsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.gap('4px'),
  },
  tdComment: {
    textAlign: 'center' as const,
  },
  select: {
    minWidth: '100px',
    width: '100%',
  },
  footerRow: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightBold,
  },
  footerLabel: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    textAlign: 'right' as const,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  footerTotal: {
    textAlign: 'center' as const,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    fontSize: tokens.fontSizeBase400,
  },
  /* Mobile stacked cards layout */
  mobileContainer: {
    display: 'none',
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      display: 'grid',
      rowGap: tokens.spacingVerticalS,
    },
  },
  desktopTable: {
    display: 'block',
    [`@media (max-width: ${BREAKPOINTS.mobile}px)`]: {
      display: 'none',
    },
  },
  mobileCard: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  mobileCardNumber: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  mobileCardLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  mobileScoreRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginTop: tokens.spacingVerticalXS,
  },
  mobileScoreLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

// ── Score Row (memoized) ───────────────────────────────────────────────

interface IScoringRowProps {
  criterion: IScorecardCriterion;
  index: number;
  originatorValue: number | undefined;
  committeeValue: number | undefined;
  onScoreChange: (criterionId: number, column: 'originator' | 'committee', value: number) => void;
  canEditOriginator: boolean;
  canEditCommittee: boolean;
  isAlt: boolean;
  // Phase 3: Collaboration
  comments?: IScorecardCriterionComment[];
  criterionMeta?: IScorecardCriterionMeta;
  currentUserEmail?: string;
  onAddComment?: (criterionId: number, text: string) => void;
  onEditComment?: (commentId: number, text: string) => void;
  onDeleteComment?: (commentId: number) => void;
  canComment?: boolean;
  isLocked?: boolean;
}

const ScoringRow: React.FC<IScoringRowProps> = React.memo(({
  criterion,
  index,
  originatorValue,
  committeeValue,
  onScoreChange,
  canEditOriginator,
  canEditCommittee,
  isAlt,
  comments,
  criterionMeta,
  currentUserEmail,
  onAddComment,
  onEditComment,
  onDeleteComment,
  canComment,
  isLocked,
}) => {
  const styles = useStyles();
  const origLabel = getScoreLabel(criterion, originatorValue);
  const cmteLabel = getScoreLabel(criterion, committeeValue);
  const meta = criterionMeta?.[criterion.id];

  const handleOrigChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = getLabelValue(criterion, e.target.value);
      if (val !== undefined) {
        onScoreChange(criterion.id, 'originator', val);
      }
    },
    [criterion, onScoreChange],
  );

  const handleCmteChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = getLabelValue(criterion, e.target.value);
      if (val !== undefined) {
        onScoreChange(criterion.id, 'committee', val);
      }
    },
    [criterion, onScoreChange],
  );

  return (
    <tr className={isAlt ? styles.trAlt : styles.tr}>
      <td className={mergeClasses(styles.td, styles.tdNumber)}>{index + 1}</td>
      <td className={mergeClasses(styles.td, styles.tdLabel)}>{criterion.label}</td>
      <td className={styles.td}>
        <Select
          className={styles.select}
          size="small"
          value={origLabel}
          disabled={!canEditOriginator}
          onChange={handleOrigChange}
          aria-label={`${criterion.label} - Originator score`}
        >
          <option value="">—</option>
          <option value="High">High ({criterion.high})</option>
          <option value="Average">Average ({criterion.avg})</option>
          <option value="Low">Low ({criterion.low})</option>
        </Select>
      </td>
      <td
        className={mergeClasses(styles.td, styles.tdPts)}
        style={{ color: getPointColor(criterion, originatorValue) }}
      >
        <div className={styles.tdPtsWrapper}>
          {originatorValue ?? '—'}
          <LastEditedAvatar
            email={meta?.lastEditedBy_orig}
            name={meta?.lastEditedBy_orig}
            timestamp={meta?.lastEditedAt_orig}
          />
        </div>
      </td>
      <td className={styles.td}>
        <Select
          className={styles.select}
          size="small"
          value={cmteLabel}
          disabled={!canEditCommittee}
          onChange={handleCmteChange}
          aria-label={`${criterion.label} - Committee score`}
        >
          <option value="">—</option>
          <option value="High">High ({criterion.high})</option>
          <option value="Average">Average ({criterion.avg})</option>
          <option value="Low">Low ({criterion.low})</option>
        </Select>
      </td>
      <td
        className={mergeClasses(styles.td, styles.tdPts)}
        style={{ color: getPointColor(criterion, committeeValue) }}
      >
        <div className={styles.tdPtsWrapper}>
          {committeeValue ?? '—'}
          <LastEditedAvatar
            email={meta?.lastEditedBy_cmte}
            name={meta?.lastEditedBy_cmte}
            timestamp={meta?.lastEditedAt_cmte}
          />
        </div>
      </td>
      {/* Phase 3: Per-criterion comment popover */}
      <td className={mergeClasses(styles.td, styles.tdComment)}>
        {comments && onAddComment && onEditComment && onDeleteComment && currentUserEmail && (
          <CriterionCommentPopover
            scorecardId={0}
            criterionId={criterion.id}
            criterionLabel={criterion.label}
            comments={comments}
            currentUserEmail={currentUserEmail}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            canComment={canComment ?? false}
            isLocked={isLocked ?? false}
          />
        )}
      </td>
    </tr>
  );
});
ScoringRow.displayName = 'ScoringRow';

// ── Mobile Score Card (memoized) ───────────────────────────────────────

interface IMobileScoringCardProps {
  criterion: IScorecardCriterion;
  index: number;
  originatorValue: number | undefined;
  committeeValue: number | undefined;
  onScoreChange: (criterionId: number, column: 'originator' | 'committee', value: number) => void;
  canEditOriginator: boolean;
  canEditCommittee: boolean;
}

const MobileScoringCard: React.FC<IMobileScoringCardProps> = React.memo(({
  criterion,
  index,
  originatorValue,
  committeeValue,
  onScoreChange,
  canEditOriginator,
  canEditCommittee,
}) => {
  const styles = useStyles();

  const handleOrigChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = getLabelValue(criterion, e.target.value);
      if (val !== undefined) onScoreChange(criterion.id, 'originator', val);
    },
    [criterion, onScoreChange],
  );

  const handleCmteChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = getLabelValue(criterion, e.target.value);
      if (val !== undefined) onScoreChange(criterion.id, 'committee', val);
    },
    [criterion, onScoreChange],
  );

  return (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardNumber}>#{index + 1}</div>
      <div className={styles.mobileCardLabel}>{criterion.label}</div>
      <div className={styles.mobileScoreRow}>
        <span className={styles.mobileScoreLabel}>Originator</span>
        <Select
          size="small"
          value={getScoreLabel(criterion, originatorValue)}
          disabled={!canEditOriginator}
          onChange={handleOrigChange}
          aria-label={`${criterion.label} - Originator`}
        >
          <option value="">—</option>
          <option value="High">High ({criterion.high})</option>
          <option value="Average">Average ({criterion.avg})</option>
          <option value="Low">Low ({criterion.low})</option>
        </Select>
      </div>
      <div className={styles.mobileScoreRow}>
        <span className={styles.mobileScoreLabel}>Committee</span>
        <Select
          size="small"
          value={getScoreLabel(criterion, committeeValue)}
          disabled={!canEditCommittee}
          onChange={handleCmteChange}
          aria-label={`${criterion.label} - Committee`}
        >
          <option value="">—</option>
          <option value="High">High ({criterion.high})</option>
          <option value="Average">Average ({criterion.avg})</option>
          <option value="Low">Low ({criterion.low})</option>
        </Select>
      </div>
    </div>
  );
});
MobileScoringCard.displayName = 'MobileScoringCard';

// ── Main Component ─────────────────────────────────────────────────────

export const ScoringTable: React.FC<IScoringTableProps> = React.memo(({
  scores,
  onScoreChange,
  canEditOriginator,
  canEditCommittee,
  isUpdating,
  originatorTotal = 0,
  committeeTotal = 0,
  originatorColor,
  committeeColor,
  criterionComments,
  criterionMeta,
  currentUserEmail,
  onAddComment,
  onEditComment,
  onDeleteComment,
  canComment,
  isLocked,
}) => {
  const styles = useStyles();

  return (
    <>
      {/* Desktop table */}
      <div className={styles.desktopTable}>
        <div className={styles.tableWrapper}>
          <table className={styles.table} role="grid" aria-label="Go/No-Go Scoring Table" aria-busy={isUpdating}>
            <thead className={styles.thead}>
              <tr>
                <th className={mergeClasses(styles.th, styles.thNumber)}>#</th>
                <th className={mergeClasses(styles.th, styles.thCriteria)}>Criteria</th>
                <th className={mergeClasses(styles.th, styles.thScore)}>Originator</th>
                <th className={mergeClasses(styles.th, styles.thPts)}>Pts</th>
                <th className={mergeClasses(styles.th, styles.thScore)}>Committee</th>
                <th className={mergeClasses(styles.th, styles.thPts)}>Pts</th>
                <th className={mergeClasses(styles.th, styles.thComment)} aria-label="Comments" />
              </tr>
            </thead>
            <tbody>
              {SCORECARD_CRITERIA.map((criterion, i) => (
                <ScoringRow
                  key={criterion.id}
                  criterion={criterion}
                  index={i}
                  originatorValue={scores[criterion.id]?.originator}
                  committeeValue={scores[criterion.id]?.committee}
                  onScoreChange={onScoreChange}
                  canEditOriginator={canEditOriginator}
                  canEditCommittee={canEditCommittee}
                  isAlt={i % 2 === 1}
                  comments={criterionComments}
                  criterionMeta={criterionMeta}
                  currentUserEmail={currentUserEmail}
                  onAddComment={onAddComment}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  canComment={canComment}
                  isLocked={isLocked}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.footerRow}>
                <td className={styles.td} />
                <td className={mergeClasses(styles.td, styles.footerLabel)}>TOTALS</td>
                <td className={styles.td} />
                <td
                  className={mergeClasses(styles.td, styles.footerTotal)}
                  style={originatorColor ? { color: originatorColor } : undefined}
                >
                  {originatorTotal}
                </td>
                <td className={styles.td} />
                <td
                  className={mergeClasses(styles.td, styles.footerTotal)}
                  style={committeeColor ? { color: committeeColor } : undefined}
                >
                  {committeeTotal}
                </td>
                <td className={styles.td} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className={styles.mobileContainer}>
        {SCORECARD_CRITERIA.map((criterion, i) => (
          <MobileScoringCard
            key={criterion.id}
            criterion={criterion}
            index={i}
            originatorValue={scores[criterion.id]?.originator}
            committeeValue={scores[criterion.id]?.committee}
            onScoreChange={onScoreChange}
            canEditOriginator={canEditOriginator}
            canEditCommittee={canEditCommittee}
          />
        ))}
      </div>
    </>
  );
});
ScoringTable.displayName = 'ScoringTable';
