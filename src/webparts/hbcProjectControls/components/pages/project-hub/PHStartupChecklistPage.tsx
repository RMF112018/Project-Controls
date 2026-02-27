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
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  progressText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
});

const CHECKLIST_CATEGORIES: IChecklistCategory[] = [
  {
    name: 'Preconstruction Handoff',
    items: [
      'Contract documents reviewed and understood by operations team',
      'Estimate reconciliation meeting completed',
      'Budget loaded into cost management system',
      'Design document review and RFI log initiated',
      'Subcontractor bid packages evaluated and buyout plan established',
      'Allowances and contingencies identified',
    ],
  },
  {
    name: 'Safety Setup',
    items: [
      'Site-specific safety plan developed and approved',
      'Safety orientation program established',
      'Emergency action plan posted at all entrances',
      'First aid station established and stocked',
      'Fire extinguishers placed per OSHA requirements',
      'PPE inventory procured and available',
      'Safety signage installed at site perimeter',
    ],
  },
  {
    name: 'Site Mobilization',
    items: [
      'Site logistics plan finalized and approved',
      'Temporary facilities (trailers, restrooms) delivered and set up',
      'Temporary utilities connected (power, water, communications)',
      'Site security fencing and access control installed',
      'Material staging and laydown areas established',
      'Dumpster and waste management plan in place',
      'Erosion and sediment control measures installed',
    ],
  },
  {
    name: 'Subcontractor Coordination',
    items: [
      'Subcontract agreements executed for initial trades',
      'Insurance certificates collected and verified',
      'Pre-mobilization meetings held with all initial trades',
      'Coordination schedule distributed to all subcontractors',
      'Subcontractor safety prequalification verified',
    ],
  },
  {
    name: 'Owner Requirements',
    items: [
      'Project kickoff meeting scheduled with owner',
      'Meeting cadence established (OAC, progress, safety)',
      'Reporting format and frequency confirmed',
      'Document management and communication protocols agreed',
      'Quality expectations and inspection requirements confirmed',
      'Payment terms and pay app schedule confirmed',
    ],
  },
];

export const PHStartupChecklistPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  const totalItems = CHECKLIST_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Startup Checklist"
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
            <div className={styles.summaryValue}>{CHECKLIST_CATEGORIES.length}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Status</div>
            <div className={styles.summaryValue}>Pending</div>
          </div>
        </div>
      </HbcCard>

      {CHECKLIST_CATEGORIES.map(category => (
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
