import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEstimating } from '../../hooks/useEstimating';
import { useLeads } from '../../hooks/useLeads';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useAppContext } from '../../contexts/AppContext';
import { RoleGate } from '../../guards/RoleGate';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { buildBreadcrumbs } from '../../../utils/breadcrumbs';
import { KPICard } from '../../shared/KPICard';
import { StatusBadge } from '../../shared/StatusBadge';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { IEstimatingTracker, ILead, AwardStatus, AuditAction, EntityType, RoleName } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatPercent,
  getDaysUntil,
  getUrgencyColor,
} from '../../../utils/formatters';
import { exportService } from '../../../services/ExportService';

const TAB_PATHS = ['/preconstruction', '/preconstruction/precon-tracker', '/preconstruction/estimate-log'];
const TAB_LABELS = ['Current Pursuits', 'Current Preconstruction', 'Estimate Log'];

function pathToTab(pathname: string): number {
  const idx = TAB_PATHS.indexOf(pathname);
  return idx >= 0 ? idx : 0;
}

const CheckIcon: React.FC = () => (
  <span style={{ color: HBC_COLORS.success, fontSize: '16px', fontWeight: 700 }}>&#10003;</span>
);
const EmptyBox: React.FC = () => (
  <span style={{ color: HBC_COLORS.gray300, fontSize: '14px' }}>&#9744;</span>
);

export const EstimatingDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  const { dataService, currentUser } = useAppContext();
  const { records, isLoading: estLoading, fetchRecords, updateRecord } = useEstimating();
  const { leads, isLoading: leadsLoading, fetchLeads } = useLeads();

  const [yearFilter, setYearFilter] = usePersistedState('estimating-year', 'All');
  const [estimatorFilter, setEstimatorFilter] = usePersistedState('estimating-estimator', 'All');
  const [regionFilter, setRegionFilter] = usePersistedState('estimating-region', 'All');
  const [sortField, setSortField] = React.useState<string>('');
  const [sortAsc, setSortAsc] = React.useState(true);

  React.useEffect(() => {
    fetchRecords().catch(console.error);
    fetchLeads().catch(console.error);
  }, [fetchRecords, fetchLeads]);

  // Build a lead lookup map
  const leadMap = React.useMemo(() => {
    const m = new Map<number, ILead>();
    leads.forEach(l => m.set(l.id, l));
    return m;
  }, [leads]);

  // Distinct filter options
  const filterOptions = React.useMemo(() => {
    const years = new Set<string>();
    const estimators = new Set<string>();
    const regions = new Set<string>();

    records.forEach(r => {
      const dateStr = r.DueDate_OutTheDoor || r.SubmittedDate;
      if (dateStr) {
        years.add(new Date(dateStr).getFullYear().toString());
      }
      if (r.LeadEstimator) estimators.add(r.LeadEstimator);
      if (r.LeadID) {
        const lead = leadMap.get(r.LeadID);
        if (lead?.Region) regions.add(lead.Region);
      }
    });

    return {
      years: ['All', ...Array.from(years).sort()],
      estimators: ['All', ...Array.from(estimators).sort()],
      regions: ['All', ...Array.from(regions).sort()],
    };
  }, [records, leadMap]);

  // Apply cross-tab filters
  const filteredRecords = React.useMemo(() => {
    return records.filter(r => {
      if (yearFilter !== 'All') {
        const dateStr = r.DueDate_OutTheDoor || r.SubmittedDate;
        if (!dateStr || new Date(dateStr).getFullYear().toString() !== yearFilter) return false;
      }
      if (estimatorFilter !== 'All' && r.LeadEstimator !== estimatorFilter) return false;
      if (regionFilter !== 'All') {
        const lead = r.LeadID ? leadMap.get(r.LeadID) : undefined;
        if (!lead || lead.Region !== regionFilter) return false;
      }
      return true;
    });
  }, [records, yearFilter, estimatorFilter, regionFilter, leadMap]);

  // Category splits
  const currentPursuits = React.useMemo(
    () => filteredRecords.filter(r => (!r.AwardStatus || r.AwardStatus === 'Pending') && !r.SubmittedDate),
    [filteredRecords]
  );
  const preconEngagements = React.useMemo(
    () => filteredRecords.filter(r => r.PreconFee !== undefined && r.PreconFee !== null && r.PreconFee > 0),
    [filteredRecords]
  );
  const estimateLog = React.useMemo(
    () => filteredRecords.filter(r => !!r.SubmittedDate),
    [filteredRecords]
  );

  // KPI calculations
  const kpis = React.useMemo(() => {
    const pipelineValue = currentPursuits.reduce((s, r) => s + (r.EstimatedCostValue || 0), 0);
    const awarded = estimateLog.filter(r =>
      r.AwardStatus === AwardStatus.AwardedWithPrecon || r.AwardStatus === AwardStatus.AwardedWithoutPrecon
    ).length;
    const notAwarded = estimateLog.filter(r => r.AwardStatus === AwardStatus.NotAwarded).length;
    const hitRate = awarded + notAwarded > 0 ? (awarded / (awarded + notAwarded)) * 100 : 0;
    const feesOutstanding = preconEngagements.reduce(
      (s, r) => s + ((r.PreconFee || 0) - (r.FeePaidToDate || 0)), 0
    );
    return {
      activePursuits: currentPursuits.length,
      pipelineValue,
      hitRate,
      feesOutstanding,
    };
  }, [currentPursuits, estimateLog, preconEngagements]);

  const handleSort = React.useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) {
        setSortAsc(a => !a);
        return field;
      }
      setSortAsc(true);
      return field;
    });
  }, []);

  const handleCheckToggle = React.useCallback(async (record: IEstimatingTracker, field: keyof IEstimatingTracker) => {
    const current = record[field] as boolean;
    await updateRecord(record.id, { [field]: !current } as Partial<IEstimatingTracker>);
    dataService.logAudit({
      Action: AuditAction.EstimateStatusChanged,
      EntityType: EntityType.Estimate,
      EntityId: String(record.id),
      ProjectCode: record.ProjectCode,
      FieldChanged: field as string,
      PreviousValue: String(current),
      NewValue: String(!current),
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: `Checklist "${field}" ${!current ? 'checked' : 'unchecked'} for "${record.Title}"`,
    }).catch(console.error);
  }, [updateRecord, dataService, currentUser]);

  // Date cell renderer
  const dateCell = (dateStr: string | undefined): React.ReactNode => {
    if (!dateStr) return <span style={{ color: HBC_COLORS.gray400 }}>-</span>;
    const days = getDaysUntil(dateStr);
    const color = getUrgencyColor(days);
    return <span style={{ color, fontWeight: days !== null && days <= 7 ? 600 : 400 }}>{formatDate(dateStr)}</span>;
  };

  // Checklist header with responsible person
  const chkHeaders: Array<{ key: keyof IEstimatingTracker; label: string }> = [
    { key: 'Chk_BidBond', label: 'Bid Bond (Wanda)' },
    { key: 'Chk_PPBond', label: 'PP Bond (Wanda)' },
    { key: 'Chk_Schedule', label: 'Schedule (Est.)' },
    { key: 'Chk_Logistics', label: 'Logistics (Est.)' },
    { key: 'Chk_BIMProposal', label: 'BIM (VDC)' },
    { key: 'Chk_PreconProposal', label: 'Precon Prop (Ryan)' },
    { key: 'Chk_ProposalTabs', label: 'Tabs (Wanda/Wendy)' },
    { key: 'Chk_CoordMarketing', label: 'Coord. Marketing' },
    { key: 'Chk_BusinessTerms', label: 'Bus. Terms (Legal)' },
  ];

  // Current Pursuits columns
  const pursuitColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'Source', header: 'Source', sortable: true, width: '90px', render: (r) => r.Source || '-' },
    { key: 'DeliverableType', header: 'Type', sortable: true, width: '80px', render: (r) => r.DeliverableType || '-' },
    { key: 'SubBidsDue', header: 'Sub Bids Due', width: '100px', render: (r) => dateCell(r.SubBidsDue) },
    { key: 'PreSubmissionReview', header: 'Pre-Sub Review', width: '100px', render: (r) => dateCell(r.PreSubmissionReview) },
    { key: 'WinStrategyMeeting', header: 'Win Strategy', width: '100px', render: (r) => dateCell(r.WinStrategyMeeting) },
    { key: 'DueDate_OutTheDoor', header: 'Due (OTD)', sortable: true, width: '100px', render: (r) => dateCell(r.DueDate_OutTheDoor) },
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, width: '80px', render: (r) => r.LeadEstimator || '-' },
    { key: 'Contributors', header: 'Contributors', width: '100px', render: (r) => {
      const contribs = r.Contributors || [];
      if (contribs.length === 0) return '-';
      return (
        <div style={{ display: 'flex', gap: '2px' }}>
          {contribs.map((c, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: HBC_COLORS.navy, color: '#fff', fontSize: '10px', fontWeight: 600,
            }} title={c}>{c[0]}</span>
          ))}
        </div>
      );
    }},
    { key: 'PX_ProjectExecutive', header: 'PX', width: '80px', render: (r) => {
      const px = r.PX_ProjectExecutive || '-';
      return px !== '-' ? px.split(' ').map(n => n[0]).join('') : '-';
    }},
    ...chkHeaders.map(ch => ({
      key: ch.key as string,
      header: ch.label,
      width: '40px',
      render: (r: IEstimatingTracker) => (
        <span
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); handleCheckToggle(r, ch.key).catch(console.error); }}
        >
          {r[ch.key] ? <CheckIcon /> : <EmptyBox />}
        </span>
      ),
    })),
    { key: 'EstimatedCostValue', header: 'Est. Value', sortable: true, width: '100px', render: (r) => (
      <span style={{ fontWeight: 500 }}>{formatCurrencyCompact(r.EstimatedCostValue)}</span>
    )},
    { key: 'Kickoff', header: 'Kick-Off', width: '90px', render: (r) => (
      <button
        onClick={(e) => { e.stopPropagation(); if (r.ProjectCode) navigate(`/preconstruction/pursuit/${r.id}/kickoff`); }}
        style={{
          padding: '4px 8px',
          background: HBC_COLORS.orange,
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: '11px',
          fontWeight: 600,
          cursor: r.ProjectCode ? 'pointer' : 'not-allowed',
          opacity: r.ProjectCode ? 1 : 0.5,
        }}
        disabled={!r.ProjectCode}
      >
        Open
      </button>
    )},
  ], [handleCheckToggle, navigate]);

  // Precon Engagements columns
  const preconColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, width: '80px', render: (r) => r.LeadEstimator || '-' },
    { key: 'PX_ProjectExecutive', header: 'PX', width: '80px', render: (r) => {
      const px = r.PX_ProjectExecutive || '-';
      return px !== '-' ? px.split(' ').map(n => n[0]).join('') : '-';
    }},
    { key: 'DocSetStage', header: 'Doc Stage', sortable: true, width: '80px', render: (r) => r.DocSetStage || '-' },
    { key: 'CurrentStage', header: 'Current Stage', width: '120px', render: (r) => {
      const lead = r.LeadID ? leadMap.get(r.LeadID) : undefined;
      return lead ? lead.Stage : '-';
    }},
    { key: 'PreconFee', header: 'Precon Budget', sortable: true, width: '110px', render: (r) => formatCurrency(r.PreconFee) },
    { key: 'DesignBudget', header: 'Design Budget', sortable: true, width: '110px', render: (r) => formatCurrency(r.DesignBudget) },
    { key: 'FeePaidToDate', header: 'Billed to Date', sortable: true, width: '110px', render: (r) => formatCurrency(r.FeePaidToDate) },
    { key: 'Remaining', header: 'Remaining', width: '110px', render: (r) => {
      const remaining = (r.PreconFee || 0) - (r.FeePaidToDate || 0);
      return <span style={{ color: remaining < 0 ? HBC_COLORS.error : HBC_COLORS.gray800, fontWeight: remaining < 0 ? 600 : 400 }}>{formatCurrency(remaining)}</span>;
    }},
  ], []);

  // Estimate Log columns
  const logColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, width: '80px', render: (r) => r.LeadEstimator || '-' },
    { key: 'EstimateType', header: 'Est. Type', sortable: true, width: '100px', render: (r) => r.EstimateType || '-' },
    { key: 'EstimatedCostValue', header: 'Est. Value', sortable: true, width: '110px', render: (r) => formatCurrencyCompact(r.EstimatedCostValue) },
    { key: 'CostPerGSF', header: '$/GSF', sortable: true, width: '80px', render: (r) => r.CostPerGSF ? `$${r.CostPerGSF}` : '-' },
    { key: 'CostPerUnit', header: '$/Unit', sortable: true, width: '80px', render: (r) => r.CostPerUnit ? `$${r.CostPerUnit.toLocaleString()}` : '-' },
    { key: 'SubmittedDate', header: 'Submitted', sortable: true, width: '100px', render: (r) => formatDate(r.SubmittedDate) },
    { key: 'AwardStatus', header: 'Award Status', sortable: true, width: '120px', render: (r) => {
      const status = r.AwardStatus || 'Pending';
      const isAwarded = status.includes('Awarded');
      const isNotAwarded = status === 'Not Awarded';
      return (
        <StatusBadge
          label={status}
          color={isAwarded ? '#065F46' : isNotAwarded ? '#991B1B' : '#1E40AF'}
          backgroundColor={isAwarded ? HBC_COLORS.successLight : isNotAwarded ? HBC_COLORS.errorLight : HBC_COLORS.infoLight}
        />
      );
    }},
    { key: 'NotesFeedback', header: 'Notes', width: '150px', render: (r) => (
      <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }} title={r.NotesFeedback || ''}>
        {r.NotesFeedback ? (r.NotesFeedback.length > 40 ? r.NotesFeedback.slice(0, 40) + '...' : r.NotesFeedback) : '-'}
      </span>
    )},
  ], []);

  // Precon fee totals
  const preconTotals = React.useMemo(() => ({
    preconFee: preconEngagements.reduce((s, r) => s + (r.PreconFee || 0), 0),
    designBudget: preconEngagements.reduce((s, r) => s + (r.DesignBudget || 0), 0),
    feePaid: preconEngagements.reduce((s, r) => s + (r.FeePaidToDate || 0), 0),
  }), [preconEngagements]);

  // Estimate log summary
  const logSummary = React.useMemo(() => {
    const totalValue = estimateLog.reduce((s, r) => s + (r.EstimatedCostValue || 0), 0);
    const awarded = estimateLog.filter(r => r.AwardStatus === AwardStatus.AwardedWithPrecon || r.AwardStatus === AwardStatus.AwardedWithoutPrecon).length;
    const notAwarded = estimateLog.filter(r => r.AwardStatus === AwardStatus.NotAwarded).length;
    const pending = estimateLog.filter(r => !r.AwardStatus || r.AwardStatus === AwardStatus.Pending).length;
    const hitRate = awarded + notAwarded > 0 ? (awarded / (awarded + notAwarded)) * 100 : 0;
    return { totalValue, awarded, notAwarded, pending, hitRate };
  }, [estimateLog]);

  // Excel export
  const handleExport = React.useCallback(async () => {
    const pursuitData = currentPursuits.map(r => ({
      Project: r.Title,
      Code: r.ProjectCode || '',
      Source: r.Source || '',
      Type: r.DeliverableType || '',
      'Sub Bids Due': r.SubBidsDue || '',
      'Pre-Sub Review': r.PreSubmissionReview || '',
      'Win Strategy': r.WinStrategyMeeting || '',
      'Due (OTD)': r.DueDate_OutTheDoor || '',
      Estimator: r.LeadEstimator || '',
      Contributors: (r.Contributors || []).join(', '),
      PX: r.PX_ProjectExecutive || '',
      'Bid Bond': r.Chk_BidBond ? 'TRUE' : 'FALSE',
      'PP Bond': r.Chk_PPBond ? 'TRUE' : 'FALSE',
      Schedule: r.Chk_Schedule ? 'TRUE' : 'FALSE',
      Logistics: r.Chk_Logistics ? 'TRUE' : 'FALSE',
      BIM: r.Chk_BIMProposal ? 'TRUE' : 'FALSE',
      'Precon Prop': r.Chk_PreconProposal ? 'TRUE' : 'FALSE',
      Tabs: r.Chk_ProposalTabs ? 'TRUE' : 'FALSE',
      Marketing: r.Chk_CoordMarketing ? 'TRUE' : 'FALSE',
      'Bus Terms': r.Chk_BusinessTerms ? 'TRUE' : 'FALSE',
      'Est. Value': r.EstimatedCostValue || 0,
    }));

    const preconData = [
      ...preconEngagements.map(r => ({
        Project: r.Title,
        Code: r.ProjectCode || '',
        Estimator: r.LeadEstimator || '',
        PX: r.PX_ProjectExecutive || '',
        'Doc Stage': r.DocSetStage || '',
        'Precon Budget': r.PreconFee || 0,
        'Design Budget': r.DesignBudget || 0,
        'Billed to Date': r.FeePaidToDate || 0,
        Remaining: (r.PreconFee || 0) - (r.FeePaidToDate || 0),
      })),
      {
        Project: 'TOTALS',
        Code: '',
        Estimator: '',
        PX: '',
        'Doc Stage': '',
        'Precon Budget': preconTotals.preconFee,
        'Design Budget': preconTotals.designBudget,
        'Billed to Date': preconTotals.feePaid,
        Remaining: preconTotals.preconFee - preconTotals.feePaid,
      },
    ];

    const logData = [
      ...estimateLog.map(r => ({
        Project: r.Title,
        Code: r.ProjectCode || '',
        Estimator: r.LeadEstimator || '',
        'Est. Type': r.EstimateType || '',
        'Est. Value': r.EstimatedCostValue || 0,
        '$/GSF': r.CostPerGSF || 0,
        '$/Unit': r.CostPerUnit || 0,
        Submitted: r.SubmittedDate || '',
        'Award Status': r.AwardStatus || 'Pending',
        Notes: r.NotesFeedback || '',
      })),
      {
        Project: 'SUMMARY',
        Code: '',
        Estimator: '',
        'Est. Type': '',
        'Est. Value': logSummary.totalValue,
        '$/GSF': 0,
        '$/Unit': 0,
        Submitted: '',
        'Award Status': `Awarded: ${logSummary.awarded} | Not Awarded: ${logSummary.notAwarded} | Pending: ${logSummary.pending} | Hit Rate: ${logSummary.hitRate.toFixed(1)}%`,
        Notes: '',
      },
    ];

    await exportService.exportToExcelMultiSheet(
      [
        { name: 'Current Pursuits', data: pursuitData },
        { name: 'Preconstruction', data: preconData },
        { name: 'Estimate Log', data: logData },
      ],
      { filename: 'HBC-Estimating-Tracker' }
    );
  }, [currentPursuits, preconEngagements, estimateLog, preconTotals, logSummary]);

  if (estLoading || leadsLoading) return <SkeletonLoader variant="table" rows={8} columns={6} />;

  const accessDenied = (
    <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
      <h3>Access Restricted</h3>
      <p>The Estimating Dashboard is restricted to Estimating Coordinators and Executive Leadership.</p>
    </div>
  );

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px', backgroundColor: '#fff', color: HBC_COLORS.gray800,
  };

  const tabStyle = (idx: number): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === idx ? 600 : 400,
    color: activeTab === idx ? HBC_COLORS.navy : HBC_COLORS.gray500,
    borderBottom: activeTab === idx ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
    transition: 'all 0.2s',
  });

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex', gap: '24px', padding: '12px 16px',
    backgroundColor: HBC_COLORS.gray50, borderRadius: '8px', marginTop: '12px', fontSize: '13px',
  };

  return (
    <RoleGate
      allowedRoles={[RoleName.EstimatingCoordinator, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector]}
      fallback={accessDenied}
    >
    <div>
      <PageHeader
        title="Estimating Dashboard"
        subtitle="Current pursuit, preconstruction, and estimate tracking"
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/job-request')}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                backgroundColor: HBC_COLORS.orange, fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                color: '#fff',
              }}
            >
              Request New Project Number
            </button>
            <button
              onClick={() => { handleExport().catch(console.error); }}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`,
                backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
                color: HBC_COLORS.navy,
              }}
            >
              Export to Excel
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Active Pursuits" value={kpis.activePursuits} />
        <KPICard title="Total Pipeline Value" value={formatCurrencyCompact(kpis.pipelineValue)} />
        <KPICard title="Hit Rate" value={formatPercent(kpis.hitRate)} subtitle="Awarded / (Awarded + Not Awarded)" />
        <KPICard title="Precon Fees Outstanding" value={formatCurrency(kpis.feesOutstanding)} />
      </div>

      {/* Cross-Tab Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
          Year:
          <select style={{ ...selectStyle, marginLeft: '6px' }} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
          Lead Estimator:
          <select style={{ ...selectStyle, marginLeft: '6px' }} value={estimatorFilter} onChange={e => setEstimatorFilter(e.target.value)}>
            {filterOptions.estimators.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
          Region:
          <select style={{ ...selectStyle, marginLeft: '6px' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '20px' }}>
        {TAB_LABELS.map((label, idx) => (
          <div
            key={idx}
            style={tabStyle(idx)}
            onClick={() => navigate(TAB_PATHS[idx])}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && (
        <DataTable<IEstimatingTracker>
          columns={pursuitColumns}
          items={currentPursuits}
          keyExtractor={r => r.id}
          onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}`)}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
          emptyTitle="No active pursuits"
          emptyDescription="Estimating records without a submitted date appear here"
          pageSize={25}
        />
      )}

      {activeTab === 1 && (
        <>
          <DataTable<IEstimatingTracker>
            columns={preconColumns}
            items={preconEngagements}
            keyExtractor={r => r.id}
            onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}`)}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={handleSort}
            emptyTitle="No precon engagements"
            emptyDescription="Records with PreconFee > 0 appear here"
          />
          {preconEngagements.length > 0 && (
            <div style={summaryRowStyle}>
              <strong>Totals:</strong>
              <span>Precon Budget: <strong>{formatCurrency(preconTotals.preconFee)}</strong></span>
              <span>Design Budget: <strong>{formatCurrency(preconTotals.designBudget)}</strong></span>
              <span>Billed to Date: <strong>{formatCurrency(preconTotals.feePaid)}</strong></span>
              <span>Remaining: <strong style={{ color: preconTotals.preconFee - preconTotals.feePaid < 0 ? HBC_COLORS.error : HBC_COLORS.gray800 }}>
                {formatCurrency(preconTotals.preconFee - preconTotals.feePaid)}
              </strong></span>
            </div>
          )}
        </>
      )}

      {activeTab === 2 && (
        <>
          <DataTable<IEstimatingTracker>
            columns={logColumns}
            items={estimateLog}
            keyExtractor={r => r.id}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={handleSort}
            emptyTitle="No submitted estimates"
            emptyDescription="Estimates with a submitted date appear here"
          />
          {estimateLog.length > 0 && (
            <div style={summaryRowStyle}>
              <span>Total Est. Value: <strong>{formatCurrencyCompact(logSummary.totalValue)}</strong></span>
              <span>Awarded: <strong style={{ color: HBC_COLORS.success }}>{logSummary.awarded}</strong></span>
              <span>Not Awarded: <strong style={{ color: HBC_COLORS.error }}>{logSummary.notAwarded}</strong></span>
              <span>Pending: <strong style={{ color: HBC_COLORS.info }}>{logSummary.pending}</strong></span>
              <span>Hit Rate: <strong>{formatPercent(logSummary.hitRate)}</strong></span>
            </div>
          )}
        </>
      )}

    </div>
    </RoleGate>
  );
};
