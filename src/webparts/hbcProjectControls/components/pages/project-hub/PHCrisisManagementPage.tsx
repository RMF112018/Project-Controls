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
  emergencyBanner: {
    ...shorthands.padding('16px', '20px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.errorLight,
    ...shorthands.borderLeft('4px', 'solid', HBC_COLORS.error),
    color: tokens.colorNeutralForeground1,
  },
  emergencyTitle: {
    fontWeight: tokens.fontWeightBold,
    color: HBC_COLORS.error,
    fontSize: tokens.fontSizeBase400,
    marginBottom: '8px',
  },
  emergencyText: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.margin('0'),
  },
  stepGrid: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  stepRow: {
    display: 'flex',
    ...shorthands.gap('16px'),
    ...shorthands.padding('14px', '0'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    alignItems: 'flex-start',
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: HBC_COLORS.error,
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
  stepText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('12px'),
  },
  contactCard: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    textAlign: 'center' as const,
  },
  contactLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    marginBottom: '4px',
  },
  contactValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
});

const CRISIS_STEPS = [
  { step: 1, title: 'Ensure Safety', text: 'Prioritize the safety of all personnel. Call 911 for life-threatening situations. Begin evacuation if necessary and conduct headcount at assembly points.' },
  { step: 2, title: 'Secure the Scene', text: 'Prevent additional injuries and preserve evidence. Restrict access to the affected area. Do not disturb the scene except to protect life.' },
  { step: 3, title: 'Notify Leadership', text: 'Contact the Project Executive and Safety Director immediately. Follow the notification chain: PX, Safety Director, Risk Manager, Legal Counsel.' },
  { step: 4, title: 'Document Everything', text: 'Photograph and video all conditions. Record names of witnesses and involved parties. Note timeline of events with timestamps.' },
  { step: 5, title: 'Control Communications', text: 'Direct all media inquiries to the designated company spokesperson. Do not release any information to third parties without authorization.' },
  { step: 6, title: 'Investigate & Report', text: 'Conduct root cause analysis within 24 hours. Complete incident report and submit to Safety. Develop corrective action plan with due dates.' },
];

const ICE_CONTACTS = [
  { label: 'Emergency Services', value: '911' },
  { label: 'Safety Director', value: 'On File' },
  { label: 'Project Executive', value: 'On File' },
  { label: 'Risk Manager', value: 'On File' },
  { label: 'Legal Counsel', value: 'On File' },
  { label: 'Insurance Carrier', value: 'On File' },
];

export const PHCrisisManagementPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Crisis Management & ICE Guide"
        subtitle={projectLabel}
      />

      <div className={styles.emergencyBanner}>
        <div className={styles.emergencyTitle}>In Case of Emergency</div>
        <p className={styles.emergencyText}>
          Call 911 immediately for any life-threatening situation. Ensure all personnel are safe
          before taking any other action. Notify the Safety Director and Project Executive as
          soon as the scene is secure.
        </p>
      </div>

      <HbcCard title="ICE Contact Directory">
        <div className={styles.contactGrid}>
          {ICE_CONTACTS.map(contact => (
            <div key={contact.label} className={styles.contactCard}>
              <div className={styles.contactLabel}>{contact.label}</div>
              <div className={styles.contactValue}>{contact.value}</div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Crisis Response Protocol" subtitle="6-step emergency response procedure">
        <div className={styles.stepGrid}>
          {CRISIS_STEPS.map(item => (
            <div key={item.step} className={styles.stepRow}>
              <div className={styles.stepNumber}>{item.step}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{item.title}</div>
                <div className={styles.stepText}>{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
