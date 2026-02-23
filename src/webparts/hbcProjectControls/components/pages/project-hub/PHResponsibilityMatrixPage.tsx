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
  matrixTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  tableHeader: {
    backgroundColor: HBC_COLORS.navy,
    color: HBC_COLORS.white,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'left' as const,
    ...shorthands.padding('10px', '12px'),
  },
  tableCell: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    color: tokens.colorNeutralForeground2,
  },
  cellCenter: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    textAlign: 'center' as const,
    fontWeight: tokens.fontWeightSemibold,
  },
  raciR: {
    color: HBC_COLORS.error,
  },
  raciA: {
    color: HBC_COLORS.navy,
  },
  raciC: {
    color: HBC_COLORS.info,
  },
  raciI: {
    color: HBC_COLORS.gray400,
  },
  legendRow: {
    display: 'flex',
    ...shorthands.gap('24px'),
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  legendBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('4px'),
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

interface IRaciRow {
  activity: string;
  px: string;
  pm: string;
  super: string;
  pe: string;
}

const RACI_DATA: IRaciRow[] = [
  { activity: 'Contract Review & Execution', px: 'A', pm: 'R', super: 'I', pe: 'C' },
  { activity: 'Schedule Development', px: 'C', pm: 'A', super: 'R', pe: 'I' },
  { activity: 'Budget Management', px: 'A', pm: 'R', super: 'C', pe: 'I' },
  { activity: 'Subcontractor Procurement', px: 'A', pm: 'R', super: 'C', pe: 'I' },
  { activity: 'Safety Program Implementation', px: 'I', pm: 'C', super: 'R', pe: 'A' },
  { activity: 'Quality Control Inspections', px: 'I', pm: 'C', super: 'R', pe: 'A' },
  { activity: 'Owner Communication', px: 'R', pm: 'A', super: 'C', pe: 'I' },
  { activity: 'Change Order Management', px: 'A', pm: 'R', super: 'C', pe: 'I' },
  { activity: 'Pay Application Processing', px: 'A', pm: 'R', super: 'C', pe: 'I' },
  { activity: 'Closeout Documentation', px: 'I', pm: 'A', super: 'R', pe: 'C' },
];

function getRaciStyle(value: string, styles: ReturnType<typeof useStyles>): string {
  switch (value) {
    case 'R': return styles.raciR;
    case 'A': return styles.raciA;
    case 'C': return styles.raciC;
    case 'I': return styles.raciI;
    default: return '';
  }
}

export const PHResponsibilityMatrixPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();
  const projectLabel = selectedProject
    ? `${selectedProject.projectCode} - ${selectedProject.projectName}`
    : undefined;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Responsibility Matrix"
        subtitle={projectLabel}
      />

      <HbcCard title="RACI Legend">
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={styles.legendBadge} style={{ backgroundColor: HBC_COLORS.errorLight, color: HBC_COLORS.error }}>R</span>
            Responsible - Does the work
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendBadge} style={{ backgroundColor: HBC_COLORS.infoLight, color: HBC_COLORS.navy }}>A</span>
            Accountable - Owns the outcome
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendBadge} style={{ backgroundColor: HBC_COLORS.infoLight, color: HBC_COLORS.info }}>C</span>
            Consulted - Provides input
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendBadge} style={{ backgroundColor: HBC_COLORS.gray100, color: HBC_COLORS.gray400 }}>I</span>
            Informed - Kept in the loop
          </div>
        </div>
      </HbcCard>

      <HbcCard title="Project Responsibility Matrix" subtitle="Team member assignments by activity">
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Activity</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center' }}>PX</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center' }}>PM</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center' }}>Super</th>
              <th className={styles.tableHeader} style={{ textAlign: 'center' }}>PE</th>
            </tr>
          </thead>
          <tbody>
            {RACI_DATA.map(row => (
              <tr key={row.activity}>
                <td className={styles.tableCell}>{row.activity}</td>
                <td className={`${styles.cellCenter} ${getRaciStyle(row.px, styles)}`}>{row.px}</td>
                <td className={`${styles.cellCenter} ${getRaciStyle(row.pm, styles)}`}>{row.pm}</td>
                <td className={`${styles.cellCenter} ${getRaciStyle(row.super, styles)}`}>{row.super}</td>
                <td className={`${styles.cellCenter} ${getRaciStyle(row.pe, styles)}`}>{row.pe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </HbcCard>
    </div>
  );
};
