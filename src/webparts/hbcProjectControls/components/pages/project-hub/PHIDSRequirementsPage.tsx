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
  requirementGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  requirementCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderTop('3px', 'solid', HBC_COLORS.info),
  },
  requirementTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '8px',
  },
  requirementText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.margin('0'),
  },
  toolList: {
    display: 'grid',
    ...shorthands.gap('8px'),
    ...shorthands.padding('0'),
    ...shorthands.margin('0'),
    listStyleType: 'none',
  },
  toolItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: HBC_COLORS.gray50,
  },
  toolIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.infoLight,
    color: HBC_COLORS.info,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    flexShrink: 0,
  },
  toolContent: {
    display: 'grid',
    ...shorthands.gap('2px'),
  },
  toolName: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase200,
  },
  toolDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
});

const IDS_REQUIREMENTS = [
  { title: 'Digital Tools', text: 'All projects must utilize the approved suite of digital tools including project management, document control, and communication platforms. Contact IDS for tool provisioning before mobilization.' },
  { title: 'BIM Requirements', text: 'BIM Execution Plan, model coordination schedule, and clash detection workflows must conform to company standards for naming conventions, LOD, and file management.' },
  { title: 'Data Security', text: 'All project technology deployments must comply with IT security policies and data governance requirements. Use approved cloud storage for all documentation. Report security incidents immediately.' },
  { title: 'Network & Connectivity', text: 'Site network requirements including Wi-Fi coverage, VPN access, and bandwidth for BIM coordination. Contact IDS at least two weeks before mobilization for network planning.' },
];

const DIGITAL_TOOLS = [
  { abbrev: 'PM', name: 'Project Management', description: 'Scheduling, task tracking, and resource management' },
  { abbrev: 'DC', name: 'Document Control', description: 'Drawing management, RFIs, and submittals' },
  { abbrev: 'BIM', name: 'BIM Coordination', description: 'Model sharing, clash detection, and coordination' },
  { abbrev: 'FLD', name: 'Field Management', description: 'Daily reports, inspections, and punch lists' },
  { abbrev: 'FIN', name: 'Financial Systems', description: 'Cost tracking, pay applications, and forecasting' },
  { abbrev: 'SAF', name: 'Safety Management', description: 'Incident reporting, training records, and audits' },
];

export const PHIDSRequirementsPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="IDS Requirements"
        subtitle={projectLabel}
      />

      <HbcCard title="Technology Requirements" subtitle="Innovation & Digital Services standards">
        <div className={styles.requirementGrid}>
          {IDS_REQUIREMENTS.map(req => (
            <div key={req.title} className={styles.requirementCard}>
              <div className={styles.requirementTitle}>{req.title}</div>
              <p className={styles.requirementText}>{req.text}</p>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Required Digital Tools" subtitle={`${DIGITAL_TOOLS.length} platform categories`}>
        <ul className={styles.toolList}>
          {DIGITAL_TOOLS.map(tool => (
            <li key={tool.abbrev} className={styles.toolItem}>
              <div className={styles.toolIcon}>{tool.abbrev}</div>
              <div className={styles.toolContent}>
                <div className={styles.toolName}>{tool.name}</div>
                <div className={styles.toolDescription}>{tool.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </HbcCard>
    </div>
  );
};
