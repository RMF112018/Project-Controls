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
  phaseGrid: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  phaseRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    alignItems: 'flex-start',
  },
  phaseBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius('6px'),
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    flexShrink: 0,
    minWidth: '72px',
    textAlign: 'center' as const,
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
  phaseDuration: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  milestoneList: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  milestoneItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: HBC_COLORS.gray50,
  },
  milestoneDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  milestoneText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  milestoneTarget: {
    marginLeft: 'auto',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    flexShrink: 0,
  },
});

const STARTUP_PHASES = [
  { phase: 'Phase 1', title: 'Preconstruction Handoff', text: 'Review of all preconstruction documents, estimates, contracts, and design packages. Knowledge transfer from estimating to operations team.', duration: 'Week 1-2', color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  { phase: 'Phase 2', title: 'Site Assessment & Planning', text: 'Site visits, existing conditions survey, logistics planning, temporary facility design, and utility coordination.', duration: 'Week 2-3', color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  { phase: 'Phase 3', title: 'Procurement & Mobilization', text: 'Subcontractor buyout, material procurement for long-lead items, trailer and equipment mobilization, and safety setup.', duration: 'Week 3-6', color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  { phase: 'Phase 4', title: 'Operations Setup', text: 'Document control system configuration, schedule baseline establishment, cost tracking setup, and communication protocol rollout.', duration: 'Week 4-6', color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  { phase: 'Phase 5', title: 'Construction Start', text: 'Kick-off meeting with owner and design team, first day of construction activities, and establishment of meeting cadence.', duration: 'Week 6-8', color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
];

const KEY_MILESTONES = [
  { text: 'Preconstruction handoff meeting completed', target: 'Day 1', color: HBC_COLORS.info },
  { text: 'Site logistics plan approved', target: 'Week 2', color: HBC_COLORS.info },
  { text: 'Safety orientation program established', target: 'Week 2', color: HBC_COLORS.error },
  { text: 'Schedule baseline approved by owner', target: 'Week 3', color: HBC_COLORS.warning },
  { text: 'All long-lead procurement initiated', target: 'Week 4', color: HBC_COLORS.warning },
  { text: 'Document control system operational', target: 'Week 4', color: HBC_COLORS.info },
  { text: 'Project kickoff meeting with all stakeholders', target: 'Week 6', color: HBC_COLORS.success },
  { text: 'First construction activity begins', target: 'Week 6', color: HBC_COLORS.success },
];

export const PHStartupGuidePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Startup Guide"
        subtitle={projectLabel}
      />

      <HbcCard title="Startup Phases" subtitle="5-phase project initiation process">
        <div className={styles.phaseGrid}>
          {STARTUP_PHASES.map(phase => (
            <div key={phase.phase} className={styles.phaseRow}>
              <span
                className={styles.phaseBadge}
                style={{ backgroundColor: phase.bg, color: phase.color }}
              >
                {phase.phase}
              </span>
              <div className={styles.phaseContent}>
                <div className={styles.phaseTitle}>{phase.title}</div>
                <div className={styles.phaseText}>{phase.text}</div>
                <div className={styles.phaseDuration}>{phase.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Key Milestones" subtitle={`${KEY_MILESTONES.length} startup milestones`}>
        <div className={styles.milestoneList}>
          {KEY_MILESTONES.map(milestone => (
            <div key={milestone.text} className={styles.milestoneItem}>
              <span className={styles.milestoneDot} style={{ backgroundColor: milestone.color }} />
              <span className={styles.milestoneText}>{milestone.text}</span>
              <span className={styles.milestoneTarget}>{milestone.target}</span>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
