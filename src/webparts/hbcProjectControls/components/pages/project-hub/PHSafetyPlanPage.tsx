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
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  sectionCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderLeft('3px', 'solid', HBC_COLORS.error),
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '8px',
  },
  sectionText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.margin('0'),
  },
  emergencyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('12px'),
  },
  emergencyItem: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.errorLight,
    textAlign: 'center' as const,
  },
  emergencyLabel: {
    color: HBC_COLORS.error,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    marginBottom: '4px',
  },
  emergencyValue: {
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
});

const SAFETY_SECTIONS = [
  { title: 'Hazard Analysis', text: 'Site-specific hazard identification and risk assessment. Includes activity hazard analyses for high-risk operations, fall protection plans, and confined space procedures.' },
  { title: 'PPE Requirements', text: 'Personal protective equipment standards including hard hats, high-visibility vests, safety glasses, steel-toed boots, and task-specific protection for welding, cutting, and chemical exposure.' },
  { title: 'Training Requirements', text: 'Mandatory safety orientation for all workers, OSHA 10/30 compliance, toolbox talks schedule, and specialized training for equipment operation and hazardous work.' },
  { title: 'Incident Reporting', text: 'Procedures for reporting injuries, near-misses, and property damage. Root cause analysis requirements and corrective action tracking for all recordable incidents.' },
  { title: 'Emergency Action Plan', text: 'Evacuation routes and assembly points, fire prevention and response, severe weather procedures, and medical emergency protocols with nearest hospital information.' },
  { title: 'Housekeeping Standards', text: 'Daily housekeeping requirements, debris removal schedule, material storage standards, and walkway/stairway maintenance protocols for fall prevention.' },
];

const EMERGENCY_CONTACTS = [
  { label: 'Emergency Services', value: '911' },
  { label: 'Safety Director', value: 'On File' },
  { label: 'Nearest Hospital', value: 'On File' },
  { label: 'Poison Control', value: '1-800-222-1222' },
];

export const PHSafetyPlanPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Safety Plan"
        subtitle={projectLabel}
      />

      <HbcCard title="Emergency Contacts">
        <div className={styles.emergencyGrid}>
          {EMERGENCY_CONTACTS.map(contact => (
            <div key={contact.label} className={styles.emergencyItem}>
              <div className={styles.emergencyLabel}>{contact.label}</div>
              <div className={styles.emergencyValue}>{contact.value}</div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Safety Plan Sections" subtitle="Project-specific safety documentation">
        <div className={styles.sectionGrid}>
          {SAFETY_SECTIONS.map(section => (
            <div key={section.title} className={styles.sectionCard}>
              <div className={styles.sectionTitle}>{section.title}</div>
              <p className={styles.sectionText}>{section.text}</p>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
