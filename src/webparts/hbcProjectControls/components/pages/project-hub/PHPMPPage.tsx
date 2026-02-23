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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  sectionNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    marginRight: '8px',
    flexShrink: 0,
  },
  sectionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.padding('8px', '0'),
  },
  sectionText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
  statusIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: HBC_COLORS.gray50,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
  },
  overviewText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.margin('0'),
  },
});

const PMP_SECTIONS = [
  { number: 1, title: 'Project Overview', description: 'Scope summary, contract type, delivery method, key milestones, and project team directory.' },
  { number: 2, title: 'Scope Management', description: 'Scope definition, work breakdown structure, change order procedures, and scope verification protocols.' },
  { number: 3, title: 'Schedule Management', description: 'Master schedule, milestone tracking, look-ahead planning, and schedule recovery procedures.' },
  { number: 4, title: 'Budget & Cost Control', description: 'Budget baseline, cost tracking, pay application process, and financial forecasting methods.' },
  { number: 5, title: 'Quality Management', description: 'Quality standards, inspection protocols, QC checklists, and non-conformance resolution.' },
  { number: 6, title: 'Safety Plan', description: 'Site-specific safety plan, hazard analysis, training requirements, and incident reporting.' },
  { number: 7, title: 'Communication Plan', description: 'Stakeholder matrix, meeting cadence, reporting requirements, and document distribution.' },
];

export const PHPMPPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Management Plan"
        subtitle={projectLabel}
      />

      <HbcCard title="PMP Overview">
        <p className={styles.overviewText}>
          The Project Management Plan establishes the framework for managing all aspects of project
          delivery. It defines processes, responsibilities, and procedures for scope, schedule,
          budget, quality, safety, and communication management throughout the project lifecycle.
        </p>
      </HbcCard>

      <HbcCard title="PMP Sections" subtitle="7 required plan sections">
        <div className={styles.sectionGrid}>
          {PMP_SECTIONS.map(section => (
            <div key={section.number} className={styles.sectionItem}>
              <span className={styles.sectionNumber}>{section.number}</span>
              <div>
                <div style={{ fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '4px' }}>
                  {section.title}
                </div>
                <div className={styles.sectionText}>{section.description}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="Plan Status">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} style={{ backgroundColor: HBC_COLORS.success }} />
            Complete
          </div>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} style={{ backgroundColor: HBC_COLORS.warning }} />
            In Progress
          </div>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} style={{ backgroundColor: HBC_COLORS.gray300 }} />
            Not Started
          </div>
        </div>
      </HbcCard>
    </div>
  );
};
