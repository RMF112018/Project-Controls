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
  workflowSteps: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  stepRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    flexShrink: 0,
  },
  stepContent: {
    display: 'grid',
    ...shorthands.gap('4px'),
  },
  stepTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
  },
  stepDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  timelineItem: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderLeft('3px', 'solid', HBC_COLORS.navy),
  },
  timelineLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    marginBottom: '4px',
  },
  timelineValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
});

const PAY_APP_STEPS = [
  { step: 1, title: 'Subcontractor Submission', description: 'Subcontractors submit pay applications with supporting documentation by the contractual due date.' },
  { step: 2, title: 'Field Verification', description: 'Superintendent verifies work-in-place percentages and confirms quantities match field conditions.' },
  { step: 3, title: 'PM Review & Approval', description: 'Project Manager reviews calculations, retainage, stored materials, and change order values.' },
  { step: 4, title: 'PX Authorization', description: 'Project Executive authorizes the owner pay application and verifies overall financial accuracy.' },
  { step: 5, title: 'Owner Submission', description: 'Pay application submitted to the Owner with schedule of values, lien waivers, and certifications.' },
  { step: 6, title: 'Payment & Reconciliation', description: 'Upon receipt, reconcile payments to subcontractors and update cost tracking systems.' },
];

const TIMELINE_ITEMS = [
  { label: 'Sub Applications Due', value: '25th of Month' },
  { label: 'Field Verification', value: '26th - 28th' },
  { label: 'PM Review Complete', value: '1st of Month' },
  { label: 'Owner Submission', value: '5th of Month' },
];

export const PHPayAppProcessPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Pay Application Process"
        subtitle={projectLabel}
      />

      <HbcCard title="Monthly Timeline" subtitle="Standard pay application schedule">
        <div className={styles.timelineGrid}>
          {TIMELINE_ITEMS.map(item => (
            <div key={item.label} className={styles.timelineItem}>
              <div className={styles.timelineLabel}>{item.label}</div>
              <div className={styles.timelineValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Workflow Steps" subtitle="End-to-end pay application process">
        <div className={styles.workflowSteps}>
          {PAY_APP_STEPS.map(step => (
            <div key={step.step} className={styles.stepRow}>
              <div className={styles.stepNumber}>{step.step}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDescription}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
