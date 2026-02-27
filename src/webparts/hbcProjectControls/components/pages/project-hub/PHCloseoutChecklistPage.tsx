import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IChecklistCategory } from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  summaryRow: {
    display: 'flex',
    ...shorthands.gap('24px'),
    flexWrap: 'wrap',
  },
  summaryItem: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    textAlign: 'center' as const,
    minWidth: '140px',
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
  checklistGroup: {
    display: 'grid',
    ...shorthands.gap('6px'),
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
    cursor: 'default',
  },
  checkBox: {
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius('3px'),
    ...shorthands.border('2px', 'solid', HBC_COLORS.gray300),
    flexShrink: 0,
    marginTop: '1px',
  },
});

const CLOSEOUT_CATEGORIES: IChecklistCategory[] = [
  {
    name: 'Punch List',
    items: [
      'Internal walkthrough completed with project team',
      'Owner/architect punch list walkthrough conducted',
      'All punch list items documented with photos and descriptions',
      'Punch list items assigned to responsible subcontractors',
      'Weekly punch list progress tracking established',
      'Owner verification of completed punch list items',
      'Final punch list sign-off obtained from owner',
    ],
  },
  {
    name: 'Final Inspections',
    items: [
      'Building department final inspection passed',
      'Fire marshal inspection and approval obtained',
      'Health department inspection completed (if applicable)',
      'Elevator inspection certificate obtained',
      'Certificate of Occupancy received',
      'All utility company final inspections passed',
      'Environmental compliance clearance obtained',
    ],
  },
  {
    name: 'Warranty Information',
    items: [
      'All subcontractor warranties collected and organized by CSI division',
      'Manufacturer warranties compiled with registration confirmation',
      'Warranty start dates documented (aligned with Substantial Completion)',
      'Warranty contact information sheet prepared for owner',
      'Warranty manual assembled and bound per contract requirements',
      'Warranty manual transmitted to owner with receipt acknowledged',
    ],
  },
  {
    name: 'As-Built Drawings',
    items: [
      'Field markup collection from all trades completed',
      'As-built drawings updated to reflect actual installed conditions',
      'All RFI and change order modifications incorporated',
      'As-built drawings reviewed by project engineer',
      'Electronic files delivered in contract-specified format',
      'Hard copies delivered (if required by contract)',
    ],
  },
  {
    name: 'O&M Manuals',
    items: [
      'HVAC system O&M documentation compiled',
      'Electrical system O&M documentation compiled',
      'Plumbing and fire protection O&M documentation compiled',
      'Building envelope maintenance documentation assembled',
      'Specialty systems documentation collected (security, AV, controls)',
      'Spare parts and attic stock inventory delivered',
      'Owner training sessions scheduled and completed',
      'Training attendance records documented',
    ],
  },
];

export const PHCloseoutChecklistPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  const totalItems = CLOSEOUT_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Closeout Checklist"
        subtitle={projectLabel}
      />

      <HbcCard title="Checklist Summary">
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Total Items</div>
            <div className={styles.summaryValue}>{totalItems}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Categories</div>
            <div className={styles.summaryValue}>{CLOSEOUT_CATEGORIES.length}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Status</div>
            <div className={styles.summaryValue}>Pending</div>
          </div>
        </div>
      </HbcCard>

      {CLOSEOUT_CATEGORIES.map(category => (
        <HbcCard
          key={category.name}
          title={category.name}
          subtitle={`${category.items.length} items`}
        >
          <div className={styles.checklistGroup}>
            {category.items.map(item => (
              <div key={item} className={styles.checklistItem}>
                <div className={styles.checkBox} />
                {item}
              </div>
            ))}
          </div>
        </HbcCard>
      ))}
    </div>
  );
};
