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
  checklistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    ...shorthands.gap('16px'),
  },
  checklistCard: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderTop('3px', 'solid', HBC_COLORS.info),
  },
  checklistTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '8px',
  },
  checklistItems: {
    display: 'grid',
    ...shorthands.gap('6px'),
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
  },
  checkBox: {
    width: '16px',
    height: '16px',
    ...shorthands.borderRadius('3px'),
    ...shorthands.border('2px', 'solid', HBC_COLORS.gray300),
    flexShrink: 0,
    marginTop: '2px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    ...shorthands.gap('12px'),
  },
  summaryCard: {
    ...shorthands.padding('14px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    textAlign: 'center' as const,
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    marginBottom: '4px',
  },
  summaryValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
});

interface IQCChecklist {
  name: string;
  items: string[];
}

const QC_CHECKLISTS: IQCChecklist[] = [
  {
    name: 'Concrete Placement',
    items: [
      'Forms inspected and approved before placement',
      'Reinforcing steel placed per drawings and shop drawings',
      'Concrete mix design verified and approved',
      'Slump and air content tested at delivery',
      'Cylinders cast for compressive strength testing',
      'Finishing and curing per specifications',
    ],
  },
  {
    name: 'Structural Steel',
    items: [
      'Shop drawings approved and current revision onsite',
      'Material certifications (mill certs) reviewed',
      'Bolt torque verification per AISC standards',
      'Welding procedures and WPS verified',
      'NDT inspection reports reviewed and accepted',
      'Fireproofing thickness verified per UL rating',
    ],
  },
  {
    name: 'MEP Rough-In',
    items: [
      'Routing and clearances verified against coordination drawings',
      'Pipe support spacing per specifications',
      'Ductwork fabrication and installation per SMACNA standards',
      'Electrical conduit routing and box placement verified',
      'Fire stopping at all penetrations inspected',
      'Pressure testing completed and documented',
    ],
  },
  {
    name: 'Building Envelope',
    items: [
      'Waterproofing membrane installed per manufacturer specs',
      'Window and curtain wall mockup tested and approved',
      'Air barrier continuity verified at all transitions',
      'Flashing details match approved shop drawings',
      'Sealant joint dimensions meet specifications',
      'Water testing completed per ASTM standards',
    ],
  },
  {
    name: 'Interior Finishes',
    items: [
      'Drywall framing and hanging per specifications',
      'Level 4/5 finish verified before painting',
      'Flooring substrate moisture testing completed',
      'Tile layout approved before installation begins',
      'Millwork and casework verified against shop drawings',
      'Paint color and finish verified per selections schedule',
    ],
  },
  {
    name: 'Commissioning',
    items: [
      'Equipment startup reports reviewed and accepted',
      'Balancing reports reviewed and accepted',
      'Controls point-to-point verification complete',
      'Functional performance testing documented',
      'Seasonal testing schedule established',
      'Owner training sessions completed and documented',
    ],
  },
];

export const PHQCChecklistsPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  const totalItems = QC_CHECKLISTS.reduce((sum, cl) => sum + cl.items.length, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="QC Checklists"
        subtitle={projectLabel}
      />

      <HbcCard title="Quality Control Overview">
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Checklists</div>
            <div className={styles.summaryValue}>{QC_CHECKLISTS.length}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Items</div>
            <div className={styles.summaryValue}>{totalItems}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Completed</div>
            <div className={styles.summaryValue}>0</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Pending</div>
            <div className={styles.summaryValue}>{totalItems}</div>
          </div>
        </div>
      </HbcCard>

      <div className={styles.checklistGrid}>
        {QC_CHECKLISTS.map(checklist => (
          <div key={checklist.name} className={styles.checklistCard}>
            <div className={styles.checklistTitle}>{checklist.name}</div>
            <div className={styles.checklistItems}>
              {checklist.items.map(item => (
                <div key={item} className={styles.checklistItem}>
                  <div className={styles.checkBox} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
