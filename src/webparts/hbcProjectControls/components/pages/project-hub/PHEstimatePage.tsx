import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

interface IEstimateLineItem {
  id: string;
  csiCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: 'Draft' | 'In Review' | 'Approved' | 'Revised';
}

const MOCK_LINE_ITEMS: IEstimateLineItem[] = [
  { id: '1', csiCode: '03 30 00', description: 'Cast-in-Place Concrete', quantity: 4200, unit: 'CY', unitCost: 285, totalCost: 1197000, status: 'Approved' },
  { id: '2', csiCode: '05 12 00', description: 'Structural Steel Framing', quantity: 380, unit: 'TON', unitCost: 4200, totalCost: 1596000, status: 'In Review' },
  { id: '3', csiCode: '07 21 00', description: 'Thermal Insulation', quantity: 28500, unit: 'SF', unitCost: 3.75, totalCost: 106875, status: 'Draft' },
  { id: '4', csiCode: '08 11 00', description: 'Metal Doors & Frames', quantity: 86, unit: 'EA', unitCost: 1450, totalCost: 124700, status: 'Approved' },
  { id: '5', csiCode: '09 29 00', description: 'Gypsum Board', quantity: 42000, unit: 'SF', unitCost: 4.25, totalCost: 178500, status: 'In Review' },
  { id: '6', csiCode: '15 00 00', description: 'Mechanical / HVAC', quantity: 1, unit: 'LS', unitCost: 2850000, totalCost: 2850000, status: 'Draft' },
  { id: '7', csiCode: '16 00 00', description: 'Electrical', quantity: 1, unit: 'LS', unitCost: 1920000, totalCost: 1920000, status: 'Draft' },
  { id: '8', csiCode: '31 23 00', description: 'Excavation & Fill', quantity: 15000, unit: 'CY', unitCost: 18, totalCost: 270000, status: 'Approved' },
];

const statusColorMap: Record<string, { color: string; backgroundColor: string }> = {
  Draft: { color: tokens.colorNeutralForeground3, backgroundColor: tokens.colorNeutralBackground3 },
  'In Review': { color: HBC_COLORS.info, backgroundColor: HBC_COLORS.infoLight },
  Approved: { color: HBC_COLORS.success, backgroundColor: HBC_COLORS.successLight },
  Revised: { color: HBC_COLORS.warning, backgroundColor: HBC_COLORS.warningLight },
};

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  estimateTable: {
    width: '100%',
    ...shorthands.borderRadius('4px'),
    ...shorthands.overflow('hidden'),
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    textAlign: 'left',
    ...shorthands.padding('10px', '12px'),
  },
  tableHeaderRight: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    textAlign: 'right',
    ...shorthands.padding('10px', '12px'),
  },
  tableCell: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  tableCellRight: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    textAlign: 'right',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    fontVariantNumeric: 'tabular-nums',
  },
  csiCode: {
    fontFamily: 'monospace',
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  totalRow: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightBold,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  infoLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  infoValue: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export const PHEstimatePage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Project Estimate" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view estimate details."
        />
      </div>
    );
  }

  const projectCode = selectedProject.projectCode || '\u2014';
  const projectName = selectedProject.projectName || 'Unknown Project';
  const grandTotal = MOCK_LINE_ITEMS.reduce((sum, item) => sum + item.totalCost, 0);
  const approvedTotal = MOCK_LINE_ITEMS.filter(i => i.status === 'Approved').reduce((sum, item) => sum + item.totalCost, 0);
  const approvedCount = MOCK_LINE_ITEMS.filter(i => i.status === 'Approved').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Estimate"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Estimated Total" value={formatCurrency(grandTotal)} />
        <KPICard title="Approved Amount" value={formatCurrency(approvedTotal)} subtitle={`${approvedCount} of ${MOCK_LINE_ITEMS.length} line items`} />
        <KPICard title="Line Items" value={String(MOCK_LINE_ITEMS.length)} />
        <KPICard title="Cost per SF" value="$186" subtitle="Based on 43,500 SF" />
      </div>

      <HbcCard title="Estimate Breakdown by CSI Division">
        <table className={styles.estimateTable}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>CSI Code</th>
              <th className={styles.tableHeader}>Description</th>
              <th className={styles.tableHeaderRight}>Qty</th>
              <th className={styles.tableHeader}>Unit</th>
              <th className={styles.tableHeaderRight}>Unit Cost</th>
              <th className={styles.tableHeaderRight}>Total</th>
              <th className={styles.tableHeader}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LINE_ITEMS.map(item => {
              const colors = statusColorMap[item.status] || statusColorMap.Draft;
              return (
                <tr key={item.id}>
                  <td className={styles.tableCell}>
                    <span className={styles.csiCode}>{item.csiCode}</span>
                  </td>
                  <td className={styles.tableCell}>{item.description}</td>
                  <td className={styles.tableCellRight}>{item.quantity.toLocaleString()}</td>
                  <td className={styles.tableCell}>{item.unit}</td>
                  <td className={styles.tableCellRight}>{formatCurrency(item.unitCost)}</td>
                  <td className={styles.tableCellRight}>{formatCurrency(item.totalCost)}</td>
                  <td className={styles.tableCell}>
                    <StatusBadge label={item.status} color={colors.color} backgroundColor={colors.backgroundColor} />
                  </td>
                </tr>
              );
            })}
            <tr className={styles.totalRow}>
              <td className={styles.tableCell} colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total</td>
              <td className={styles.tableCellRight} style={{ fontWeight: 700 }}>{formatCurrency(grandTotal)}</td>
              <td className={styles.tableCell} />
            </tr>
          </tbody>
        </table>
      </HbcCard>

      <div className={styles.sectionGrid}>
        <HbcCard title="Estimate Summary">
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Estimate Type</span>
            <span className={styles.infoValue}>Detailed / Quantity Takeoff</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Lead Estimator</span>
            <span className={styles.infoValue}>Pending Assignment</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Due Date</span>
            <span className={styles.infoValue}>{'\u2014'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Contingency</span>
            <span className={styles.infoValue}>5% ({formatCurrency(Math.round(grandTotal * 0.05))})</span>
          </div>
        </HbcCard>

        <HbcCard title="Subcontractor Coverage">
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Bids Requested</span>
            <span className={styles.infoValue}>24</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Bids Received</span>
            <span className={styles.infoValue}>14</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Coverage Rate</span>
            <span className={styles.infoValue}>58%</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Outstanding</span>
            <span className={styles.infoValue}>10 trades pending</span>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
