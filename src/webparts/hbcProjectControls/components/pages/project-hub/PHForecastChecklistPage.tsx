import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Circle24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';
import type {
  ProjectHubChecklistStatus as ChecklistStatus,
  ProjectHubChecklistItem as IChecklistItem,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const MOCK_CHECKLIST_ITEMS: IChecklistItem[] = [
  {
    id: 'chk-1',
    title: 'Budget Review',
    description: 'Review original budget vs current approved budget including all approved change orders and allowance adjustments.',
    status: 'Complete',
    assignee: 'Mike Thompson',
    dueDate: '2026-02-15',
    notes: 'Budget reconciled with accounting on 02/14.',
  },
  {
    id: 'chk-2',
    title: 'Cost Projections',
    description: 'Update projected final costs for all cost codes. Verify subcontractor commitments and anticipated change orders.',
    status: 'Complete',
    assignee: 'Sarah Chen',
    dueDate: '2026-02-18',
  },
  {
    id: 'chk-3',
    title: 'Cash Flow Analysis',
    description: 'Prepare monthly cash flow projections through project completion. Reconcile billing schedule with anticipated expenditures.',
    status: 'In Progress',
    assignee: 'David Rodriguez',
    dueDate: '2026-02-22',
    notes: 'Awaiting updated billing schedule from owner.',
  },
  {
    id: 'chk-4',
    title: 'Risk Assessment',
    description: 'Identify and quantify financial risks including potential claims, weather delays, material escalation, and subcontractor defaults.',
    status: 'In Progress',
    assignee: 'Mike Thompson',
    dueDate: '2026-02-25',
  },
  {
    id: 'chk-5',
    title: 'Contingency Review',
    description: 'Evaluate remaining contingency balance against identified risks. Recommend contingency draw-down or reallocation.',
    status: 'Not Started',
    assignee: 'Sarah Chen',
    dueDate: '2026-02-28',
  },
];

const STATUS_CONFIG: Record<ChecklistStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  'Complete': {
    color: HBC_COLORS.success,
    bg: HBC_COLORS.successLight,
    icon: <Checkmark24Regular />,
  },
  'In Progress': {
    color: HBC_COLORS.info,
    bg: HBC_COLORS.infoLight,
    icon: <Clock24Regular />,
  },
  'Not Started': {
    color: HBC_COLORS.gray500,
    bg: HBC_COLORS.gray100,
    icon: <Circle24Regular />,
  },
};

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow4,
  },
  progressTrack: {
    flexGrow: 1,
    height: '8px',
    backgroundColor: HBC_COLORS.gray200,
    ...shorthands.borderRadius('4px'),
    ...shorthands.overflow('hidden'),
  },
  progressFill: {
    height: '100%',
    ...shorthands.borderRadius('4px'),
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  progressLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    minWidth: '60px',
    textAlign: 'right' as const,
  },
  progressSubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    minWidth: '120px',
  },
  checklistItem: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr auto',
    ...shorthands.gap('12px'),
    alignItems: 'start',
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ':last-child': {
      ...shorthands.borderBottom('0', 'none', 'transparent'),
    },
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('50%'),
  },
  itemContent: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  itemTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  itemDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  itemMeta: {
    display: 'flex',
    ...shorthands.gap('16px'),
    marginTop: '4px',
  },
  metaLabel: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
  metaValue: {
    fontSize: '11px',
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
  },
  itemNotes: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    marginTop: '4px',
    ...shorthands.padding('4px', '8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('4px'),
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
});

export const PHForecastChecklistPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const completedCount = MOCK_CHECKLIST_ITEMS.filter(i => i.status === 'Complete').length;
  const totalCount = MOCK_CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Forecast Review Checklist"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.progressBar}>
        <span className={styles.progressSubtext}>Checklist Progress</span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressPct === 100 ? HBC_COLORS.success : HBC_COLORS.info,
            }}
          />
        </div>
        <span className={styles.progressLabel}>{completedCount}/{totalCount}</span>
      </div>

      <HbcCard
        title="Review Items"
        subtitle={`${completedCount} of ${totalCount} items complete`}
      >
        {MOCK_CHECKLIST_ITEMS.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <div key={item.id} className={styles.checklistItem}>
              <div
                className={styles.iconContainer}
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div className={styles.itemContent}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.itemDescription}>{item.description}</span>
                <div className={styles.itemMeta}>
                  <span>
                    <span className={styles.metaLabel}>Assignee: </span>
                    <span className={styles.metaValue}>{item.assignee}</span>
                  </span>
                  <span>
                    <span className={styles.metaLabel}>Due: </span>
                    <span className={styles.metaValue}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </span>
                </div>
                {item.notes && (
                  <div className={styles.itemNotes}>{item.notes}</div>
                )}
              </div>
              <span
                className={styles.statusBadge}
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {item.status}
              </span>
            </div>
          );
        })}
      </HbcCard>

      <HbcCard
        title="Review Notes"
        subtitle="General observations and follow-up items"
      >
        <div className={styles.itemDescription}>
          Forecast review cycle for Period 02-2026. Budget reconciliation completed with
          accounting department. Cash flow projections pending updated billing schedule
          from owner representative. Risk assessment to include evaluation of potential
          material price escalation for structural steel (current market volatility).
          Contingency review deferred until risk assessment is finalized.
        </div>
      </HbcCard>
    </div>
  );
};
