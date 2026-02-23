import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

type PermitStatus = 'Approved' | 'Pending' | 'Under Review' | 'Expired' | 'Not Submitted';

interface IPermitEntry {
  id: string;
  permitType: string;
  permitNumber: string;
  issuingAuthority: string;
  submittedDate: string | null;
  approvedDate: string | null;
  expirationDate: string | null;
  status: PermitStatus;
  notes: string;
}

const MOCK_PERMITS: IPermitEntry[] = [
  { id: 'p-1', permitType: 'Building Permit', permitNumber: 'BP-2025-04821', issuingAuthority: 'City of West Palm Beach', submittedDate: '2025-08-10', approvedDate: '2025-09-12', expirationDate: '2026-09-12', status: 'Approved', notes: 'Main building permit for commercial office construction.' },
  { id: 'p-2', permitType: 'Foundation Permit', permitNumber: 'FP-2025-04822', issuingAuthority: 'City of West Palm Beach', submittedDate: '2025-08-10', approvedDate: '2025-09-05', expirationDate: '2026-09-05', status: 'Approved', notes: 'Foundation and substructure work.' },
  { id: 'p-3', permitType: 'Electrical Permit', permitNumber: 'EP-2026-00312', issuingAuthority: 'City of West Palm Beach', submittedDate: '2026-01-15', approvedDate: '2026-02-01', expirationDate: '2027-02-01', status: 'Approved', notes: 'Electrical rough-in and service entrance.' },
  { id: 'p-4', permitType: 'Mechanical Permit', permitNumber: 'MP-2026-00188', issuingAuthority: 'City of West Palm Beach', submittedDate: '2026-01-20', approvedDate: null, expirationDate: null, status: 'Under Review', notes: 'HVAC system installation. Awaiting plan review comments.' },
  { id: 'p-5', permitType: 'Plumbing Permit', permitNumber: 'PP-2026-00201', issuingAuthority: 'City of West Palm Beach', submittedDate: '2026-01-22', approvedDate: null, expirationDate: null, status: 'Under Review', notes: 'Plumbing rough-in and fixtures.' },
  { id: 'p-6', permitType: 'Fire Alarm Permit', permitNumber: '\u2014', issuingAuthority: 'Fire Marshal', submittedDate: '2026-02-10', approvedDate: null, expirationDate: null, status: 'Pending', notes: 'Fire alarm system design under review by fire marshal.' },
  { id: 'p-7', permitType: 'Elevator Permit', permitNumber: '\u2014', issuingAuthority: 'State Elevator Division', submittedDate: null, approvedDate: null, expirationDate: null, status: 'Not Submitted', notes: 'Elevator plans in preparation. Target submission: March 2026.' },
  { id: 'p-8', permitType: 'ROW / MOT Permit', permitNumber: 'ROW-2025-09901', issuingAuthority: 'City of West Palm Beach', submittedDate: '2025-09-01', approvedDate: '2025-09-20', expirationDate: '2026-03-20', status: 'Approved', notes: 'Right-of-way and maintenance of traffic for crane operation.' },
];

const STATUS_CONFIG: Record<PermitStatus, { color: string; bg: string }> = {
  'Approved': { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  'Pending': { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  'Under Review': { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  'Expired': { color: HBC_COLORS.error, bg: HBC_COLORS.errorLight },
  'Not Submitted': { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
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
  td: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground1,
  },
  tdMono: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  tdNotes: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    maxWidth: '280px',
  },
});

export const PHPermitLogPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const approvedCount = MOCK_PERMITS.filter(p => p.status === 'Approved').length;
  const pendingCount = MOCK_PERMITS.filter(p => p.status === 'Pending' || p.status === 'Under Review').length;
  const notSubmittedCount = MOCK_PERMITS.filter(p => p.status === 'Not Submitted').length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Permit Log"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard title="Total Permits" value={MOCK_PERMITS.length} />
        <KPICard
          title="Approved"
          value={approvedCount}
          subtitle={`${Math.round((approvedCount / MOCK_PERMITS.length) * 100)}% approved`}
        />
        <KPICard
          title="Pending / Under Review"
          value={pendingCount}
          subtitle="Awaiting approval"
        />
        <KPICard
          title="Not Yet Submitted"
          value={notSubmittedCount}
          subtitle="In preparation"
        />
      </div>

      <HbcCard title="Permit Tracking" subtitle="All project permits and their current status">
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.th}>Permit Type</th>
              <th className={styles.th}>Permit No.</th>
              <th className={styles.th}>Authority</th>
              <th className={styles.th}>Submitted</th>
              <th className={styles.th}>Approved</th>
              <th className={styles.th}>Expires</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PERMITS.map((permit) => {
              const statusCfg = STATUS_CONFIG[permit.status];
              return (
                <tr key={permit.id}>
                  <td className={styles.td} style={{ fontWeight: tokens.fontWeightSemibold as string }}>
                    {permit.permitType}
                  </td>
                  <td className={styles.tdMono}>{permit.permitNumber}</td>
                  <td className={styles.td}>{permit.issuingAuthority}</td>
                  <td className={styles.td}>
                    {permit.submittedDate ? new Date(permit.submittedDate).toLocaleDateString() : '\u2014'}
                  </td>
                  <td className={styles.td}>
                    {permit.approvedDate ? new Date(permit.approvedDate).toLocaleDateString() : '\u2014'}
                  </td>
                  <td className={styles.td}>
                    {permit.expirationDate ? new Date(permit.expirationDate).toLocaleDateString() : '\u2014'}
                  </td>
                  <td className={styles.td}>
                    <StatusBadge label={permit.status} color={statusCfg.color} backgroundColor={statusCfg.bg} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HbcCard>

      <HbcCard title="Permit Notes" subtitle="Key items requiring attention">
        {MOCK_PERMITS.filter(p => p.status !== 'Approved').map((permit) => (
          <div key={permit.id} style={{ padding: '8px 0', borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
            <div style={{ fontWeight: 600, color: HBC_COLORS.navy, fontSize: '13px' }}>{permit.permitType}</div>
            <div style={{ color: HBC_COLORS.textGray, fontSize: '12px', marginTop: '2px' }}>{permit.notes}</div>
          </div>
        ))}
      </HbcCard>
    </div>
  );
};
