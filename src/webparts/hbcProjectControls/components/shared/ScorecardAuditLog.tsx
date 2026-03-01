/**
 * Phase 3 (GNG Plan) — Change history panel with Timeline and Versions tabs.
 * Displays IAuditEntry[] as a chronological timeline and IScorecardVersion[]
 * as a structured table.
 */
import * as React from 'react';
import {
  makeStyles,
  shorthands,
  Tab,
  TabList,
  tokens,
} from '@fluentui/react-components';
import type { IAuditEntry, IScorecardVersion } from '@hbc/sp-services';
import { CollapsibleSection } from './CollapsibleSection';
import { StatusBadge } from './StatusBadge';
import { HbcEmptyState } from './HbcEmptyState';
import { HbcSkeleton } from './HbcSkeleton';
import { HBC_COLORS } from '../../theme/tokens';

// ── Styles ──────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  tabContent: {
    marginTop: tokens.spacingVerticalM,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('0', '0', '0', tokens.spacingHorizontalM),
    ...shorthands.borderLeft('2px', 'solid', tokens.colorNeutralStroke2),
  },
  timelineItem: {
    position: 'relative' as const,
    ...shorthands.padding(tokens.spacingVerticalXS, '0', tokens.spacingVerticalS, tokens.spacingHorizontalM),
  },
  timelineDot: {
    position: 'absolute' as const,
    left: '-7px',
    top: '10px',
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border('2px', 'solid', tokens.colorNeutralBackground1),
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    flexWrap: 'wrap',
  },
  timelineUser: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  timelineTime: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  timelineDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXXS,
  },
  dateGroup: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
    ...shorthands.padding('0', '0', '0', tokens.spacingHorizontalM),
  },
  // Versions table
  versionsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  vth: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'left' as const,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },
  vtd: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground2,
  },
});

// ── Types ───────────────────────────────────────────────────────────────

export interface IScorecardAuditLogProps {
  scorecardId: number;
  auditEntries: IAuditEntry[];
  versions: IScorecardVersion[];
  isLoading: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  });
}

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

/** Map audit action strings to a color for the StatusBadge */
function getActionBadgeProps(action: string): { label: string; color: string; bg: string } {
  if (action.includes('Comment')) return { label: 'Comment', color: '#004085', bg: '#CCE5FF' };
  if (action.includes('Note') || action.includes('Mention')) return { label: 'Note', color: '#004085', bg: '#CCE5FF' };
  if (action.includes('Submitted')) return { label: 'Submitted', color: '#856404', bg: '#FFF3CD' };
  if (action.includes('Returned')) return { label: 'Returned', color: '#856404', bg: '#FFF3CD' };
  if (action.includes('Decision') || action.includes('Approved')) return { label: 'Decision', color: '#155724', bg: '#D4EDDA' };
  if (action.includes('Rejected')) return { label: 'Rejected', color: '#721C24', bg: '#F8D7DA' };
  if (action.includes('Unlocked')) return { label: 'Unlocked', color: '#004085', bg: '#CCE5FF' };
  if (action.includes('Relocked') || action.includes('Locked')) return { label: 'Locked', color: '#383D41', bg: '#E2E3E5' };
  if (action.includes('Version')) return { label: 'Version', color: '#155724', bg: '#D4EDDA' };
  return { label: 'Update', color: '#383D41', bg: '#E2E3E5' };
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined) return tokens.colorNeutralForeground3;
  if (score >= 69) return HBC_COLORS.scoreTierHigh;
  if (score >= 55) return HBC_COLORS.scoreTierMid;
  return HBC_COLORS.scoreTierLow;
}

// ── Timeline View ───────────────────────────────────────────────────────

const TimelineView: React.FC<{ entries: IAuditEntry[] }> = React.memo(({ entries }) => {
  const styles = useStyles();

  const grouped = React.useMemo(() => {
    const groups: Record<string, IAuditEntry[]> = {};
    for (const entry of entries) {
      const key = getDateKey(entry.Timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    return groups;
  }, [entries]);

  if (entries.length === 0) {
    return <HbcEmptyState title="No history yet" description="Actions on this scorecard will appear here." />;
  }

  return (
    <>
      {Object.entries(grouped).map(([date, items]) => (
        <React.Fragment key={date}>
          <div className={styles.dateGroup}>{date}</div>
          <div className={styles.timeline}>
            {items.map((entry) => {
              const badge = getActionBadgeProps(entry.Action);
              return (
                <div key={entry.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineHeader}>
                    <span className={styles.timelineUser}>{entry.User}</span>
                    <StatusBadge label={badge.label} color={badge.color} backgroundColor={badge.bg} />
                    <span className={styles.timelineTime}>{formatTime(entry.Timestamp)}</span>
                  </div>
                  <div className={styles.timelineDetails}>{entry.Details}</div>
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </>
  );
});
TimelineView.displayName = 'TimelineView';

// ── Versions View ───────────────────────────────────────────────────────

const VersionsView: React.FC<{ versions: IScorecardVersion[] }> = React.memo(({ versions }) => {
  const styles = useStyles();

  if (versions.length === 0) {
    return <HbcEmptyState title="No versions yet" description="Version snapshots are created at key workflow transitions." />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={styles.versionsTable} aria-label="Scorecard version history">
        <thead>
          <tr>
            <th className={styles.vth}>Version</th>
            <th className={styles.vth}>Date</th>
            <th className={styles.vth}>Author</th>
            <th className={styles.vth}>Reason</th>
            <th className={styles.vth}>Orig Total</th>
            <th className={styles.vth}>Cmte Total</th>
            <th className={styles.vth}>Decision</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.id}>
              <td className={styles.vtd}>{v.versionNumber}</td>
              <td className={styles.vtd}>{formatDate(v.createdDate)}</td>
              <td className={styles.vtd}>{v.createdBy}</td>
              <td className={styles.vtd}>{v.reason ?? '—'}</td>
              <td className={styles.vtd} style={{ color: getScoreColor(v.totalOriginal) }}>
                {v.totalOriginal ?? '—'}
              </td>
              <td className={styles.vtd} style={{ color: getScoreColor(v.totalCommittee) }}>
                {v.totalCommittee ?? '—'}
              </td>
              <td className={styles.vtd}>{v.decision ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
VersionsView.displayName = 'VersionsView';

// ── Main Component ──────────────────────────────────────────────────────

export const ScorecardAuditLog: React.FC<IScorecardAuditLogProps> = React.memo(({
  auditEntries,
  versions,
  isLoading,
}) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = React.useState<string>('timeline');

  if (isLoading) {
    return (
      <CollapsibleSection title="Change History" defaultExpanded={false}>
        <HbcSkeleton variant="text" />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Change History" defaultExpanded={false}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        aria-label="Audit log view selector"
      >
        <Tab value="timeline">Timeline ({auditEntries.length})</Tab>
        <Tab value="versions">Versions ({versions.length})</Tab>
      </TabList>
      <div className={styles.tabContent}>
        {selectedTab === 'timeline' ? (
          <TimelineView entries={auditEntries} />
        ) : (
          <VersionsView versions={versions} />
        )}
      </div>
    </CollapsibleSection>
  );
});
ScorecardAuditLog.displayName = 'ScorecardAuditLog';
