import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

interface IChangeOrder {
  number: string;
  description: string;
  amount: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  submittedDate: string;
}

interface IRiskItem {
  description: string;
  likelihood: 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
}

const MOCK_CHANGE_ORDERS: IChangeOrder[] = [
  { number: 'CO-001', description: 'Owner-requested lobby upgrades', amount: 185_000, status: 'Approved', submittedDate: '2025-11-15' },
  { number: 'CO-002', description: 'Electrical room relocation', amount: 95_000, status: 'Approved', submittedDate: '2025-12-10' },
  { number: 'CO-003', description: 'Additional roof drain per structural review', amount: 42_000, status: 'Approved', submittedDate: '2026-01-05' },
  { number: 'CO-004', description: 'Enhanced HVAC controls for tenant suites', amount: 128_000, status: 'Pending', submittedDate: '2026-02-01' },
  { number: 'CO-005', description: 'Upgraded parking lot lighting', amount: 67_000, status: 'Pending', submittedDate: '2026-02-10' },
  { number: 'CO-006', description: 'Landscape irrigation modification', amount: 23_000, status: 'Pending', submittedDate: '2026-02-15' },
];

const MOCK_RISKS: IRiskItem[] = [
  { description: 'Structural steel delivery delay from fabricator', likelihood: 'Medium', impact: 'Potential 5-day schedule delay on 3rd floor', mitigation: 'Expediting with fabricator. Alternate sequence being evaluated.' },
  { description: 'Hurricane season exposure (Jun-Nov)', likelihood: 'Low', impact: 'Potential multi-day shutdowns during storm events', mitigation: 'Storm preparedness plan in place. 12 weather days in baseline.' },
  { description: 'Curtain wall lead time uncertainty', likelihood: 'Medium', impact: 'Exterior envelope completion may shift 1 week', mitigation: 'Owner RFI response needed to finalize procurement.' },
  { description: 'Labor availability during peak construction', likelihood: 'Low', impact: 'Possible schedule compression in MEP rough-in', mitigation: 'Pre-committed labor with key subcontractors.' },
];

const CO_STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Approved': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Pending': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Rejected': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
};

const LIKELIHOOD_CONFIG: Record<string, { color: string; bg: string }> = {
  'High': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'Medium': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Low': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
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
  reportHeader: {
    display: 'grid',
    ...shorthands.gap('8px'),
    ...shorthands.padding('20px'),
    backgroundColor: HBC_COLORS.navy,
    ...shorthands.borderRadius('8px'),
    color: HBC_COLORS.white,
  },
  reportTitle: {
    fontSize: '20px',
    fontWeight: '700',
  },
  reportSubtitle: {
    fontSize: tokens.fontSizeBase200,
    opacity: 0.8,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  tableHead: {
    backgroundColor: HBC_COLORS.gray50,
  },
  th: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'left' as const,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.gray200),
  },
  thRight: {
    ...shorthands.padding('10px', '12px'),
    textAlign: 'right' as const,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    ...shorthands.borderBottom('2px', 'solid', HBC_COLORS.gray200),
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
  },
  tdRight: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground1,
  },
  tdMono: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: 'monospace',
    color: tokens.colorNeutralForeground3,
  },
  totalRow: {
    fontWeight: tokens.fontWeightBold,
    backgroundColor: HBC_COLORS.gray50,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  label: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  value: {
    color: HBC_COLORS.navy,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  riskItem: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    ...shorthands.gap('4px'),
    ...shorthands.padding('12px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskDesc: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  riskDetail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  riskMitigation: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('6px', '10px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('4px'),
    marginTop: '4px',
  },
});

export const PHOwnerReportPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const approvedCOs = MOCK_CHANGE_ORDERS.filter(co => co.status === 'Approved');
  const pendingCOs = MOCK_CHANGE_ORDERS.filter(co => co.status === 'Pending');
  const totalApproved = approvedCOs.reduce((sum, co) => sum + co.amount, 0);
  const totalPending = pendingCOs.reduce((sum, co) => sum + co.amount, 0);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Owner Report"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.reportHeader}>
        <span className={styles.reportTitle}>Monthly Owner Report - February 2026</span>
        <span className={styles.reportSubtitle}>
          Prepared for: Owner Representative | Prepared by: Hedrick Brothers Construction | Date: Feb 20, 2026
        </span>
      </div>

      <div className={styles.kpiGrid}>
        <KPICard
          title="Contract Value"
          value={formatCurrency(16_690_000)}
        />
        <KPICard
          title="% Complete"
          value="47%"
          subtitle="On track"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Schedule Status"
          value="+3 days"
          subtitle="Ahead of baseline"
        />
        <KPICard
          title="Safety TRIR"
          value="0.00"
          subtitle="Zero recordable incidents"
        />
      </div>

      <div className={styles.sectionGrid}>
        <HbcCard title="Project Status" subtitle="Current period highlights">
          <div className={styles.infoRow}>
            <span className={styles.label}>Work Completed This Period</span>
            <span className={styles.value}>2nd Floor Steel Erection</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Work in Progress</span>
            <span className={styles.value}>3rd Floor Slab Prep</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Upcoming Milestones</span>
            <span className={styles.value}>Structure Top-Out (Mar 15)</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Weather Days This Period</span>
            <span className={styles.value}>1 day</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Workforce On Site (Peak)</span>
            <span className={styles.value}>84 workers</span>
          </div>
        </HbcCard>

        <HbcCard title="Schedule Update" subtitle="Key schedule metrics">
          <div className={styles.infoRow}>
            <span className={styles.label}>Baseline Completion</span>
            <span className={styles.value}>Nov 15, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Projected Completion</span>
            <span className={styles.value}>Nov 22, 2026</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Schedule Variance</span>
            <span className={styles.value} style={{ color: HBC_COLORS.success }}>+3 days ahead</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Critical Path Float</span>
            <span className={styles.value}>5 days</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Activities Completed</span>
            <span className={styles.value}>586 of 1,247</span>
          </div>
        </HbcCard>
      </div>

      <HbcCard title="Budget Summary" subtitle="Financial overview for owner">
        <div className={styles.infoRow}>
          <span className={styles.label}>Original Contract Value</span>
          <span className={styles.value}>{formatCurrency(16_000_000)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Approved Change Orders</span>
          <span className={styles.value}>{formatCurrency(totalApproved)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Current Contract Value</span>
          <span className={styles.value}>{formatCurrency(16_000_000 + totalApproved)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Billings to Date</span>
          <span className={styles.value}>{formatCurrency(7_850_000)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Retainage Held</span>
          <span className={styles.value}>{formatCurrency(485_000)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Remaining Contract Balance</span>
          <span className={styles.value}>{formatCurrency(16_000_000 + totalApproved - 7_850_000)}</span>
        </div>
      </HbcCard>

      <HbcCard title="Change Orders" subtitle="Approved and pending change orders">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>CO #</th>
              <th className={styles.th}>Description</th>
              <th className={styles.thRight}>Amount</th>
              <th className={styles.th}>Submitted</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CHANGE_ORDERS.map((co) => {
              const statusCfg = CO_STATUS_CONFIG[co.status];
              return (
                <tr key={co.number}>
                  <td className={styles.tdMono}>{co.number}</td>
                  <td className={styles.td}>{co.description}</td>
                  <td className={styles.tdRight}>{formatCurrency(co.amount)}</td>
                  <td className={styles.td}>{new Date(co.submittedDate).toLocaleDateString()}</td>
                  <td className={styles.td}>
                    <StatusBadge label={co.status} color={statusCfg.color} backgroundColor={statusCfg.bg} />
                  </td>
                </tr>
              );
            })}
            <tr className={styles.totalRow}>
              <td className={styles.td} />
              <td className={styles.td}>Approved Total</td>
              <td className={styles.tdRight}>{formatCurrency(totalApproved)}</td>
              <td className={styles.td} />
              <td className={styles.td} />
            </tr>
            <tr>
              <td className={styles.td} />
              <td className={styles.td} style={{ fontStyle: 'italic' }}>Pending Total</td>
              <td className={styles.tdRight} style={{ fontStyle: 'italic' }}>{formatCurrency(totalPending)}</td>
              <td className={styles.td} />
              <td className={styles.td} />
            </tr>
          </tbody>
        </table>
      </HbcCard>

      <HbcCard title="Issues & Risks" subtitle="Current risk register items relevant to owner">
        {MOCK_RISKS.map((risk, index) => {
          const likelihoodCfg = LIKELIHOOD_CONFIG[risk.likelihood];
          return (
            <div key={index} className={styles.riskItem}>
              <div className={styles.riskHeader}>
                <span className={styles.riskDesc}>{risk.description}</span>
                <StatusBadge label={risk.likelihood} color={likelihoodCfg.color} backgroundColor={likelihoodCfg.bg} />
              </div>
              <span className={styles.riskDetail}>Impact: {risk.impact}</span>
              <div className={styles.riskMitigation}>
                <strong>Mitigation:</strong> {risk.mitigation}
              </div>
            </div>
          );
        })}
      </HbcCard>
    </div>
  );
};
