import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  phaseTimeline: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  phaseRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    ...shorthands.padding('14px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    alignItems: 'flex-start',
  },
  phaseIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  phaseContent: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  phaseTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
  },
  phaseText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  trackingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  trackingItem: {
    ...shorthands.padding('14px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    textAlign: 'center' as const,
  },
  trackingLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    marginBottom: '6px',
  },
  trackingValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  trackingStatus: {
    marginTop: '6px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
});

const COMPLETION_PHASES = [
  { number: 1, title: 'Pre-Substantial Completion', text: 'Internal walkthrough and punch list generation. All major systems operational and tested. MEP commissioning complete. Final cleaning in progress.', color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  { number: 2, title: 'Substantial Completion', text: 'Owner/architect walkthrough and acceptance of the work. Certificate of Substantial Completion issued. Warranty periods begin. Owner may begin beneficial occupancy.', color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  { number: 3, title: 'Punch List Resolution', text: 'Systematic completion of all punch list items. Weekly progress tracking and owner verification of completed items. Target 100% resolution within 30 days.', color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  { number: 4, title: 'Final Completion', text: 'All contract requirements satisfied. Final inspections passed. Certificate of Occupancy obtained. All closeout documentation submitted and accepted.', color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  { number: 5, title: 'Owner Acceptance', text: 'Formal acceptance of the completed work. Final retainage released. Training sessions completed. Transition to warranty service period.', color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
];

const TRACKING_ITEMS = [
  { label: 'Substantial Completion', value: 'TBD', status: 'Pending', statusColor: HBC_COLORS.gray400 },
  { label: 'Punch List Items', value: '0 / 0', status: 'Not Started', statusColor: HBC_COLORS.gray400 },
  { label: 'Final Inspections', value: '0 / 0', status: 'Not Started', statusColor: HBC_COLORS.gray400 },
  { label: 'Certificate of Occupancy', value: 'TBD', status: 'Pending', statusColor: HBC_COLORS.gray400 },
  { label: 'Owner Acceptance', value: 'TBD', status: 'Pending', statusColor: HBC_COLORS.gray400 },
];

export const PHCompletionAcceptancePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Completion & Acceptance Process"
        subtitle={projectLabel}
      />

      <HbcCard title="Completion Tracking">
        <div className={styles.trackingGrid}>
          {TRACKING_ITEMS.map(item => (
            <div key={item.label} className={styles.trackingItem}>
              <div className={styles.trackingLabel}>{item.label}</div>
              <div className={styles.trackingValue}>{item.value}</div>
              <div className={styles.trackingStatus} style={{ color: item.statusColor }}>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Completion & Acceptance Process" subtitle="5-phase acceptance workflow">
        <div className={styles.phaseTimeline}>
          {COMPLETION_PHASES.map(phase => (
            <div key={phase.number} className={styles.phaseRow}>
              <div
                className={styles.phaseIndicator}
                style={{ backgroundColor: phase.bg, color: phase.color }}
              >
                {phase.number}
              </div>
              <div className={styles.phaseContent}>
                <div className={styles.phaseTitle}>{phase.title}</div>
                <div className={styles.phaseText}>{phase.text}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
