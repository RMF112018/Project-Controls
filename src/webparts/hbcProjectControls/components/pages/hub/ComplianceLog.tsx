import * as React from 'react';
import { HBC_COLORS } from '../../../theme/tokens';
import { useComplianceLog } from '../../hooks/useComplianceLog';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { ExportButtons } from '../../shared/ExportButtons';
import { IComplianceEntry } from '../../../models/IComplianceSummary';
import { EVerifyStatus } from '../../../models/IBuyoutEntry';
import { CommitmentStatus } from '../../../models/ICommitmentApproval';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const EVERIFY_STATUS_COLORS: Record<EVerifyStatus, { bg: string; color: string; label: string }> = {
  'Not Sent': { bg: HBC_COLORS.gray200, color: HBC_COLORS.gray700, label: 'Not Sent' },
  'Sent': { bg: HBC_COLORS.infoLight, color: '#1E40AF', label: 'Sent' },
  'Reminder Sent': { bg: HBC_COLORS.warningLight, color: '#92400E', label: 'Reminder' },
  'Received': { bg: HBC_COLORS.successLight, color: '#065F46', label: 'Received' },
  'Overdue': { bg: HBC_COLORS.errorLight, color: '#991B1B', label: 'Overdue' },
};

const COMMITMENT_STATUS_COLORS: Partial<Record<CommitmentStatus, { bg: string; color: string }>> = {
  Budgeted: { bg: HBC_COLORS.gray200, color: HBC_COLORS.gray700 },
  PendingReview: { bg: HBC_COLORS.warningLight, color: '#92400E' },
  WaiverPending: { bg: '#FFF7ED', color: '#C2410C' },
  PXApproved: { bg: '#DBEAFE', color: '#1E40AF' },
  ComplianceReview: { bg: '#F3E8FF', color: '#6B21A8' },
  CFOReview: { bg: HBC_COLORS.errorLight, color: '#991B1B' },
  Committed: { bg: HBC_COLORS.successLight, color: '#065F46' },
  Rejected: { bg: HBC_COLORS.errorLight, color: '#991B1B' },
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 4,
  boxSizing: 'border-box' as const,
};

const ComplianceIcon: React.FC<{ compliant: boolean }> = ({ compliant }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: compliant ? HBC_COLORS.successLight : HBC_COLORS.errorLight,
    color: compliant ? '#065F46' : '#991B1B',
  }}>
    {compliant ? '\u2713' : '\u2717'}
  </span>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComplianceLog: React.FC = () => {
  const {
    entries, summary, loading, error, filters,
    updateFilters, clearFilters,
    uniqueProjects, uniqueEVerifyStatuses, uniqueCommitmentStatuses,
  } = useComplianceLog();

  const { isMobile } = useResponsive();

  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const toggleExpanded = (id: number): void => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const exportData = React.useMemo(() => {
    return entries.map(e => ({
      'Project': e.projectCode,
      'Division': `${e.divisionCode} ${e.divisionDescription}`,
      'Subcontractor': e.subcontractorName,
      'Contract Value': e.contractValue,
      'Risk': e.riskCompliant ? 'Compliant' : 'Non-Compliant',
      'Documents': e.documentsCompliant ? 'Complete' : 'Incomplete',
      'E-Verify': e.eVerifyStatus,
      'E-Verify Contract #': e.eVerifyContractNumber || '',
      'E-Verify Sent': e.eVerifySentDate || '',
      'E-Verify Received': e.eVerifyReceivedDate || '',
      'SDI Enrolled': e.sdiEnrolled ? 'Yes' : 'No',
      'Bond Required': e.bondRequired ? 'Yes' : 'No',
      'Status': e.commitmentStatus,
      'Overall': e.overallCompliant ? 'Compliant' : 'Non-Compliant',
    }));
  }, [entries]);

  if (loading && entries.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: HBC_COLORS.gray500 }}>Loading compliance log...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: HBC_COLORS.error }}>{error}</div>
      </div>
    );
  }

  return (
    <div id="compliance-log-view" style={{ padding: isMobile ? 12 : 24 }}>
      <PageHeader
        title="Compliance Log"
        subtitle="Compliance status for all active commitments across projects"
        actions={
          <ExportButtons
            pdfElementId="compliance-log-view"
            data={exportData}
            filename="compliance-log"
            title="Compliance Log"
          />
        }
      />

      {/* KPI Summary Tiles */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}>
          <KPICard
            title="Total Commitments"
            value={summary.totalCommitments}
            icon={<span style={{ fontSize: 20 }}>&#128203;</span>}
          />
          <KPICard
            title="Fully Compliant"
            value={summary.fullyCompliant}
            subtitle={summary.totalCommitments > 0 ? `${Math.round((summary.fullyCompliant / summary.totalCommitments) * 100)}%` : '0%'}
            icon={<span style={{ fontSize: 20 }}>&#9989;</span>}
          />
          <KPICard
            title="E-Verify Pending"
            value={summary.eVerifyPending}
            icon={<span style={{ fontSize: 20 }}>&#9200;</span>}
          />
          <KPICard
            title="E-Verify Overdue"
            value={summary.eVerifyOverdue}
            icon={<span style={{ fontSize: 20 }}>&#9888;</span>}
          />
          <KPICard
            title="Docs Missing"
            value={summary.documentsMissing}
            icon={<span style={{ fontSize: 20 }}>&#128196;</span>}
          />
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
        padding: 16,
        backgroundColor: HBC_COLORS.gray50,
        borderRadius: 8,
        border: `1px solid ${HBC_COLORS.gray200}`,
      }}>
        <input
          type="text"
          placeholder="Search subcontractor, project, or division..."
          value={filters.searchQuery ?? ''}
          onChange={e => updateFilters({ searchQuery: e.target.value || undefined })}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select
          value={filters.commitmentStatus ?? ''}
          onChange={e => updateFilters({ commitmentStatus: (e.target.value as CommitmentStatus) || undefined })}
          style={{ ...inputStyle, minWidth: 140 }}
        >
          <option value="">All Statuses</option>
          {uniqueCommitmentStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.eVerifyStatus ?? ''}
          onChange={e => updateFilters({ eVerifyStatus: (e.target.value as EVerifyStatus) || undefined })}
          style={{ ...inputStyle, minWidth: 140 }}
        >
          <option value="">All E-Verify</option>
          {uniqueEVerifyStatuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.projectCode ?? ''}
          onChange={e => updateFilters({ projectCode: e.target.value || undefined })}
          style={{ ...inputStyle, minWidth: 140 }}
        >
          <option value="">All Projects</option>
          {uniqueProjects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {(filters.searchQuery || filters.commitmentStatus || filters.eVerifyStatus || filters.projectCode) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              border: `1px solid ${HBC_COLORS.gray300}`,
              borderRadius: 4,
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: HBC_COLORS.gray600,
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 12 }}>
        Showing {entries.length} commitment{entries.length !== 1 ? 's' : ''}
      </div>

      {/* Compliance Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: HBC_COLORS.navy, color: '#fff' }}>
              <th style={thStyle}></th>
              <th style={thStyle}>Project / Division</th>
              <th style={thStyle}>Subcontractor</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Contract Value</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Risk</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Docs</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Insurance</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>E-Verify</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Overall</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: HBC_COLORS.gray400 }}>
                  No compliance entries found. Try adjusting your filters.
                </td>
              </tr>
            )}
            {entries.map(entry => (
              <React.Fragment key={entry.id}>
                <tr
                  onClick={() => toggleExpanded(entry.id)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: `1px solid ${HBC_COLORS.gray200}`,
                    backgroundColor: expandedId === entry.id ? HBC_COLORS.gray50 : '#fff',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { if (expandedId !== entry.id) e.currentTarget.style.backgroundColor = HBC_COLORS.gray50; }}
                  onMouseLeave={e => { if (expandedId !== entry.id) e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontSize: 10, color: HBC_COLORS.gray400, transition: 'transform 0.15s', display: 'inline-block', transform: expandedId === entry.id ? 'rotate(90deg)' : 'none' }}>
                      &#9654;
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{entry.projectCode}</div>
                    <div style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>{entry.divisionCode} {entry.divisionDescription}</div>
                  </td>
                  <td style={tdStyle}>{entry.subcontractorName}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(entry.contractValue)}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><ComplianceIcon compliant={entry.riskCompliant} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><ComplianceIcon compliant={entry.documentsCompliant && entry.hasCommitmentDocument} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}><ComplianceIcon compliant={entry.insuranceCompliant} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <EVerifyBadge status={entry.eVerifyStatus} />
                  </td>
                  <td style={tdStyle}>
                    <CommitmentStatusBadge status={entry.commitmentStatus} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <ComplianceIcon compliant={entry.overallCompliant} />
                  </td>
                </tr>

                {/* Expanded Detail Row */}
                {expandedId === entry.id && (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <ComplianceDetail entry={entry} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};

const EVerifyBadge: React.FC<{ status: EVerifyStatus }> = ({ status }) => {
  const cfg = EVERIFY_STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const CommitmentStatusBadge: React.FC<{ status: CommitmentStatus }> = ({ status }) => {
  const cfg = COMMITMENT_STATUS_COLORS[status] ?? { bg: HBC_COLORS.gray200, color: HBC_COLORS.gray700 };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
};

const ComplianceDetail: React.FC<{ entry: IComplianceEntry }> = ({ entry }) => {
  const sectionStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 200,
    padding: 16,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: HBC_COLORS.navy,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${HBC_COLORS.gray200}`,
  };
  const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: 12,
  };

  return (
    <div style={{
      backgroundColor: HBC_COLORS.gray50,
      borderBottom: `2px solid ${HBC_COLORS.gray200}`,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 0,
    }}>
      {/* Risk Profile */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Risk Profile</div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Q-Score</span>
          <span style={{ fontWeight: 600, color: (entry.qScore ?? 0) >= 70 ? '#065F46' : '#991B1B' }}>
            {entry.qScore ?? 'N/A'}
          </span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Compass Status</span>
          <span style={{ fontWeight: 600, color: entry.compassStatus === 'Approved' ? '#065F46' : '#92400E' }}>
            {entry.compassStatus ?? 'N/A'}
          </span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>SDI Enrolled</span>
          <ComplianceIcon compliant={entry.sdiEnrolled} />
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Bond Required</span>
          <span style={{ fontSize: 11, color: entry.bondRequired ? HBC_COLORS.info : HBC_COLORS.gray500 }}>
            {entry.bondRequired ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Document Compliance */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Document Compliance</div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Scope Match</span>
          <ComplianceIcon compliant={entry.scopeMatch} />
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Exhibit C (Insurance)</span>
          <ComplianceIcon compliant={entry.exhibitC} />
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Exhibit D (Schedule)</span>
          <ComplianceIcon compliant={entry.exhibitD} />
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Exhibit E (Safety)</span>
          <ComplianceIcon compliant={entry.exhibitE} />
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Commitment Document</span>
          <ComplianceIcon compliant={entry.hasCommitmentDocument} />
        </div>
      </div>

      {/* E-Verify Tracking */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>E-Verify Tracking</div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Contract #</span>
          <span style={{ fontWeight: 600, fontSize: 11 }}>{entry.eVerifyContractNumber || 'N/A'}</span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Sent Date</span>
          <span style={{ fontSize: 11 }}>{entry.eVerifySentDate || '--'}</span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Reminder Sent</span>
          <span style={{ fontSize: 11 }}>{entry.eVerifyReminderDate || '--'}</span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Received Date</span>
          <span style={{ fontSize: 11, fontWeight: entry.eVerifyReceivedDate ? 600 : 400, color: entry.eVerifyReceivedDate ? '#065F46' : HBC_COLORS.gray400 }}>
            {entry.eVerifyReceivedDate || '--'}
          </span>
        </div>
        <div style={detailRowStyle}>
          <span style={{ color: HBC_COLORS.gray600 }}>Status</span>
          <EVerifyBadge status={entry.eVerifyStatus} />
        </div>
      </div>
    </div>
  );
};
