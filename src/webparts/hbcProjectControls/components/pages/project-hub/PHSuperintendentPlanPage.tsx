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
  sectionList: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  sectionItem: {
    display: 'flex',
    ...shorthands.gap('12px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
  },
  sectionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    marginBottom: '4px',
    fontSize: tokens.fontSizeBase300,
  },
  sectionDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  overviewText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.margin('0'),
  },
});

const PLAN_SECTIONS = [
  { key: 'SM', title: 'Site Mobilization', description: 'Temporary facilities, site layout, access routes, staging areas, and material laydown zones.' },
  { key: 'LS', title: 'Logistics & Sequencing', description: 'Phasing plan, crane placement, delivery scheduling, and vertical/horizontal logistics coordination.' },
  { key: 'SC', title: 'Subcontractor Coordination', description: 'Trade sequencing, coordination meetings, space allocation, and conflict resolution protocols.' },
  { key: 'QC', title: 'Quality Control Approach', description: 'Inspection frequency, hold points, mock-up requirements, and commissioning milestones.' },
  { key: 'SS', title: 'Site Safety Management', description: 'Site-specific hazard analysis, safety zones, PPE requirements, and emergency procedures.' },
  { key: 'WF', title: 'Workforce Planning', description: 'Staffing plan, crew scheduling, labor tracking, and productivity monitoring approach.' },
];

export const PHSuperintendentPlanPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Superintendent's Plan"
        subtitle={projectLabel}
      />

      <HbcCard title="Construction Management Plan" subtitle="Superintendent's approach to project delivery">
        <p className={styles.overviewText}>
          The Superintendent&apos;s Plan outlines the field-level strategy for managing construction
          operations, including site logistics, trade coordination, quality control, and safety
          management. This document serves as the primary reference for daily field operations
          and is maintained throughout the project lifecycle.
        </p>
      </HbcCard>

      <HbcCard title="Plan Sections" subtitle={`${PLAN_SECTIONS.length} key areas`}>
        <div className={styles.sectionList}>
          {PLAN_SECTIONS.map(section => (
            <div key={section.key} className={styles.sectionItem}>
              <div className={styles.sectionIcon}>{section.key}</div>
              <div>
                <div className={styles.sectionTitle}>{section.title}</div>
                <div className={styles.sectionDescription}>{section.description}</div>
              </div>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
