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
  checklistGroup: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('10px'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: HBC_COLORS.gray50,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  checkBox: {
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius('3px'),
    ...shorthands.border('2px', 'solid', HBC_COLORS.gray300),
    flexShrink: 0,
    marginTop: '1px',
  },
  phaseTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '12px',
  },
  phaseSection: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.borderLeft('3px', 'solid', HBC_COLORS.warning),
    backgroundColor: HBC_COLORS.warningLight,
    marginBottom: '12px',
  },
  warningText: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    ...shorthands.margin('0'),
  },
});

const BEFORE_VISIT_ITEMS = [
  'Verify all safety data sheets (SDS) are current and accessible',
  'Confirm OSHA 300 log and 300A summary are posted and current',
  'Review all training records and certifications for completeness',
  'Inspect all posted safety signage and emergency information',
  'Ensure fire extinguishers are inspected and properly tagged',
  'Verify first aid kits are stocked and accessible',
  'Confirm fall protection equipment inspection records are current',
  'Brief site leadership on OSHA inspection protocols',
];

const DURING_VISIT_ITEMS = [
  'Designate an escort to accompany the compliance officer at all times',
  'Take detailed notes of all observations and questions asked',
  'Photograph all areas photographed by the inspector',
  'Do not volunteer information beyond what is specifically requested',
  'Ensure only authorized personnel discuss site conditions',
  'Document the names and titles of all OSHA personnel present',
  'Request copies of any sampling or monitoring conducted',
];

const AFTER_VISIT_ITEMS = [
  'Immediately document all findings from the inspection',
  'Prepare a written summary for project and corporate leadership',
  'Develop corrective action plan with owners and due dates',
  'Preserve all documentation related to the inspection',
  'Track all corrective actions to verified completion',
  'Coordinate with legal counsel if citations are issued',
];

export const PHOSHAGuidePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="OSHA Site Visit Guide"
        subtitle={projectLabel}
      />

      <div className={styles.phaseSection}>
        <p className={styles.warningText}>
          OSHA compliance officers have the right to inspect any workplace covered by the OSH Act.
          Cooperate fully while protecting company rights. Contact the Safety Director and legal
          counsel immediately upon notification of an OSHA visit.
        </p>
      </div>

      <HbcCard title="Before the Visit" subtitle={`${BEFORE_VISIT_ITEMS.length} preparation items`}>
        <div className={styles.checklistGroup}>
          {BEFORE_VISIT_ITEMS.map(item => (
            <div key={item} className={styles.checklistItem}>
              <div className={styles.checkBox} />
              {item}
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="During the Visit" subtitle={`${DURING_VISIT_ITEMS.length} protocol items`}>
        <div className={styles.checklistGroup}>
          {DURING_VISIT_ITEMS.map(item => (
            <div key={item} className={styles.checklistItem}>
              <div className={styles.checkBox} />
              {item}
            </div>
          ))}
        </div>
      </HbcCard>

      <HbcCard title="After the Visit" subtitle={`${AFTER_VISIT_ITEMS.length} follow-up items`}>
        <div className={styles.checklistGroup}>
          {AFTER_VISIT_ITEMS.map(item => (
            <div key={item} className={styles.checklistItem}>
              <div className={styles.checkBox} />
              {item}
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
