import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IMeetingTemplate } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  agendaList: {
    listStyleType: 'none',
    ...shorthands.padding('0'),
    ...shorthands.margin('0'),
    display: 'grid',
    ...shorthands.gap('6px'),
  },
  agendaItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  bullet: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: HBC_COLORS.navy,
    flexShrink: 0,
  },
  frequencyBadge: {
    display: 'inline-flex',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: HBC_COLORS.infoLight,
    color: HBC_COLORS.info,
  },
});

const MEETING_TEMPLATES: IMeetingTemplate[] = [
  {
    name: 'OAC Meeting',
    frequency: 'Bi-Weekly',
    agendaItems: [
      'Safety report and incident review',
      'Schedule update and look-ahead',
      'Budget and cost report',
      'Change order status',
      'RFI and submittal log review',
      'Quality control update',
      'Action items and next steps',
    ],
  },
  {
    name: 'Subcontractor Coordination',
    frequency: 'Weekly',
    agendaItems: [
      'Two-week look-ahead review',
      'Manpower and resource needs',
      'Material deliveries and staging',
      'Trade coordination and conflicts',
      'Safety topics and toolbox talks',
      'Action items from previous meeting',
    ],
  },
  {
    name: 'Safety Meeting',
    frequency: 'Weekly',
    agendaItems: [
      'Incident and near-miss review',
      'Weekly safety topic presentation',
      'Hazard identification and mitigation',
      'PPE compliance review',
      'Upcoming high-risk activities',
      'Emergency procedure reminders',
    ],
  },
  {
    name: 'Progress Meeting',
    frequency: 'Monthly',
    agendaItems: [
      'Executive project summary',
      'Schedule performance analysis',
      'Financial performance review',
      'Risk register update',
      'Quality metrics and trends',
      'Stakeholder concerns and actions',
      'Milestone forecast review',
    ],
  },
];

export const PHMeetingTemplatesPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Meeting Agenda Templates"
        subtitle={projectLabel}
      />

      <HbcCard title="Available Templates" subtitle={`${MEETING_TEMPLATES.length} standard meeting formats`}>
        <div className={styles.templateGrid}>
          {MEETING_TEMPLATES.map(template => (
            <HbcCard
              key={template.name}
              title={template.name}
              headerActions={<span className={styles.frequencyBadge}>{template.frequency}</span>}
            >
              <ul className={styles.agendaList}>
                {template.agendaItems.map(item => (
                  <li key={item} className={styles.agendaItem}>
                    <span className={styles.bullet} />
                    {item}
                  </li>
                ))}
              </ul>
            </HbcCard>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Meeting Guidelines">
        <ul className={styles.agendaList}>
          <li className={styles.agendaItem}>
            <span className={styles.bullet} />
            Distribute agenda at least 24 hours before the meeting
          </li>
          <li className={styles.agendaItem}>
            <span className={styles.bullet} />
            Record meeting minutes and distribute within 48 hours
          </li>
          <li className={styles.agendaItem}>
            <span className={styles.bullet} />
            Track all action items with assigned owners and due dates
          </li>
          <li className={styles.agendaItem}>
            <span className={styles.bullet} />
            Review outstanding action items at the start of each meeting
          </li>
        </ul>
      </HbcCard>
    </div>
  );
};
