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
    backgroundColor: HBC_COLORS.navy,
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
  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap('12px'),
  },
  docCard: {
    ...shorthands.padding('14px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderLeft('3px', 'solid', HBC_COLORS.navy),
  },
  docTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: tokens.fontSizeBase200,
    marginBottom: '6px',
  },
  docText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase200,
    ...shorthands.margin('0'),
  },
});

const CLOSEOUT_STEPS = [
  { step: 1, title: 'Punch List Generation', text: 'Walk the project with the owner, architect, and key subcontractors to identify all incomplete or deficient work items. Document with photographs and clear descriptions.' },
  { step: 2, title: 'Punch List Completion', text: 'Assign and track all punch list items to completion. Coordinate subcontractor callbacks and verify corrections. Target 100% completion before final inspection.' },
  { step: 3, title: 'Final Inspections', text: 'Schedule and coordinate all required final inspections including building department, fire marshal, health department, and elevator inspections. Obtain all certificates of occupancy.' },
  { step: 4, title: 'Warranty Documentation', text: 'Collect and organize all warranty documentation from subcontractors and manufacturers. Compile the warranty manual per contract requirements and transmit to the owner.' },
  { step: 5, title: 'As-Built Documentation', text: 'Compile as-built drawings reflecting all field changes, RFI responses, and change orders. Deliver in the format specified by the contract (paper, electronic, or both).' },
  { step: 6, title: 'O&M Manuals', text: 'Assemble operations and maintenance manuals for all building systems. Include manufacturer literature, maintenance schedules, spare parts lists, and training records.' },
  { step: 7, title: 'Final Accounting', text: 'Process all final change orders, close out all subcontracts, release final retainage, and submit the final pay application. Reconcile all project costs against the budget.' },
  { step: 8, title: 'Demobilization', text: 'Remove all temporary facilities, equipment, and materials from the site. Restore staging areas and access roads. Return all keys, access cards, and security codes to the owner.' },
];

const REQUIRED_DOCUMENTS = [
  { title: 'Certificate of Occupancy', text: 'Issued by the authority having jurisdiction certifying the building is safe for occupancy.' },
  { title: 'Warranty Manual', text: 'Compiled warranties from all subcontractors and manufacturers organized by CSI division.' },
  { title: 'As-Built Drawings', text: 'Complete set of drawings reflecting actual installed conditions and all changes.' },
  { title: 'O&M Manuals', text: 'Operations and maintenance documentation for all mechanical, electrical, and plumbing systems.' },
  { title: 'Final Lien Waivers', text: 'Unconditional final lien waivers from all subcontractors and material suppliers.' },
  { title: 'Training Records', text: 'Documentation of all owner training sessions for building systems and equipment.' },
];

export const PHCloseoutGuidePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Closeout Guide"
        subtitle={projectLabel}
      />

      <HbcCard title="Closeout Process" subtitle="8-step closeout procedure">
        <div className={styles.stepGrid}>
          {CLOSEOUT_STEPS.map(item => (
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

      <HbcCard title="Required Closeout Documents" subtitle={`${REQUIRED_DOCUMENTS.length} deliverables`}>
        <div className={styles.docGrid}>
          {REQUIRED_DOCUMENTS.map(doc => (
            <div key={doc.title} className={styles.docCard}>
              <div className={styles.docTitle}>{doc.title}</div>
              <p className={styles.docText}>{doc.text}</p>
            </div>
          ))}
        </div>
      </HbcCard>
    </div>
  );
};
