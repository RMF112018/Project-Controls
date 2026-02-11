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
import { IEstimatingTracker, ILead, AwardStatus, EstimateSource, DeliverableType, AuditAction, EntityType, RoleName } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { PERMISSIONS } from '../../../utils/permissions';
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

// --- Inline editing helpers ---

const InlineInput = React.memo<{
  recordId: number;
  field: string;
  value: string;
  updateFn: (id: number, data: Partial<IEstimatingTracker>) => Promise<unknown>;
  disabled?: boolean;
}>(({ recordId, field, value, updateFn, disabled }) => {
  const [val, setVal] = React.useState(value);
  React.useEffect(() => { setVal(value); }, [value]);
  return (
    <input
      type="text"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { if (val !== value) updateFn(recordId, { [field]: val } as Partial<IEstimatingTracker>); }}
      disabled={disabled}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', padding: '3px 6px', border: `1px solid ${HBC_COLORS.gray200}`,
        borderRadius: 4, fontSize: '12px', backgroundColor: disabled ? 'transparent' : '#fff',
        outline: 'none', boxSizing: 'border-box',
      }}
    />
  );
});

const InlineNumber = React.memo<{
  recordId: number;
  field: string;
  value: number | undefined;
  updateFn: (id: number, data: Partial<IEstimatingTracker>) => Promise<unknown>;
  disabled?: boolean;
  format?: (v: number | undefined) => string;
}>(({ recordId, field, value, updateFn, disabled, format }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(String(value ?? ''));
  React.useEffect(() => { setVal(String(value ?? '')); }, [value]);
  if (!editing) {
    return (
      <span
        onClick={e => { if (!disabled) { e.stopPropagation(); setEditing(true); } }}
        style={{ cursor: disabled ? 'default' : 'pointer', fontWeight: 500 }}
      >
        {format ? format(value) : (value != null ? `$${value.toLocaleString()}` : '-')}
      </span>
    );
  }
  return (
    <input
      type="number"
      value={val}
      autoFocus
      onChange={e => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const num = parseFloat(val) || 0;
        if (num !== (value ?? 0)) updateFn(recordId, { [field]: num } as Partial<IEstimatingTracker>);
      }}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', padding: '3px 6px', border: `1px solid ${HBC_COLORS.navy}`,
        borderRadius: 4, fontSize: '12px', outline: 'none', boxSizing: 'border-box',
      }}
    />
  );
});

const InlineDate = React.memo<{
  recordId: number;
  field: string;
  value: string | undefined;
  updateFn: (id: number, data: Partial<IEstimatingTracker>) => Promise<unknown>;
  disabled?: boolean;
}>(({ recordId, field, value, updateFn, disabled }) => {
  const [val, setVal] = React.useState(value || '');
  React.useEffect(() => { setVal(value || ''); }, [value]);
  const days = getDaysUntil(val || undefined);
  const color = getUrgencyColor(days);
  return (
    <input
      type="date"
      value={val}
      onChange={e => {
        setVal(e.target.value);
      }}
      onBlur={() => { if (val !== (value || '')) updateFn(recordId, { [field]: val || undefined } as Partial<IEstimatingTracker>); }}
      disabled={disabled}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', padding: '2px 4px', border: `1px solid ${HBC_COLORS.gray200}`,
        borderRadius: 4, fontSize: '11px', backgroundColor: disabled ? 'transparent' : '#fff',
        outline: 'none', boxSizing: 'border-box', color,
        fontWeight: days !== null && days <= 7 ? 600 : 400,
      }}
    />
  );
});

const InlineSelect = React.memo<{
  recordId: number;
  field: string;
  value: string | undefined;
  options: string[];
  updateFn: (id: number, data: Partial<IEstimatingTracker>) => Promise<unknown>;
  disabled?: boolean;
}>(({ recordId, field, value, options, updateFn, disabled }) => {
  return (
    <select
      value={value || ''}
      onChange={e => { e.stopPropagation(); updateFn(recordId, { [field]: e.target.value || undefined } as Partial<IEstimatingTracker>); }}
      disabled={disabled}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', padding: '3px 4px', border: `1px solid ${HBC_COLORS.gray200}`,
        borderRadius: 4, fontSize: '11px', backgroundColor: disabled ? 'transparent' : '#fff',
        outline: 'none', boxSizing: 'border-box',
      }}
    >
      <option value="">-</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
});

export const EstimatingDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = pathToTab(location.pathname);
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  const { dataService, currentUser, hasPermission } = useAppContext();
  const { records, isLoading: estLoading, fetchRecords, updateRecord } = useEstimating();
  const { leads, isLoading: leadsLoading, fetchLeads } = useLeads();

  const canEdit = hasPermission(PERMISSIONS.ESTIMATING_EDIT);

  const [yearFilter, setYearFilter] = usePersistedState('estimating-year', 'All');
  const [estimatorFilter, setEstimatorFilter] = usePersistedState('estimating-estimator', 'All');
  const [regionFilter, setRegionFilter] = usePersistedState('estimating-region', 'All');
  const [sortField, setSortField] = React.useState<string>('');
  const [sortAsc, setSortAsc] = React.useState(true);

  React.useEffect(() => {
    fetchRecords().catch(console.error);
    fetchLeads().catch(console.error);
  }, [fetchRecords, fetchLeads]);

  // Inline update with audit
  const handleInlineUpdate = React.useCallback(async (id: number, data: Partial<IEstimatingTracker>) => {
    if (!canEdit) return;
    await updateRecord(id, data);
    const fieldName = Object.keys(data)[0];
    dataService.logAudit({
      Action: AuditAction.EstimateStatusChanged,
      EntityType: EntityType.Estimate,
      EntityId: String(id),
      FieldChanged: fieldName,
      NewValue: String(Object.values(data)[0] ?? ''),
      User: currentUser?.displayName || 'Unknown',
      UserId: currentUser?.id,
      Details: `Inline edit: ${fieldName} updated`,
    }).catch(console.error);
  }, [canEdit, updateRecord, dataService, currentUser]);

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

  // Checklist headers — stripped parenthetical names
  const chkHeaders: Array<{ key: keyof IEstimatingTracker; label: string }> = [
    { key: 'Chk_BidBond', label: 'Bid Bond' },
    { key: 'Chk_PPBond', label: 'PP Bond' },
    { key: 'Chk_Schedule', label: 'Schedule' },
    { key: 'Chk_Logistics', label: 'Logistics' },
    { key: 'Chk_BIMProposal', label: 'BIM' },
    { key: 'Chk_PreconProposal', label: 'Precon Prop' },
    { key: 'Chk_ProposalTabs', label: 'Tabs' },
    { key: 'Chk_CoordMarketing', label: 'Coord. Marketing' },
    { key: 'Chk_BusinessTerms', label: 'Bus. Terms' },
  ];

  const sourceOptions = Object.values(EstimateSource);
  const typeOptions = Object.values(DeliverableType);
  const awardOptions = Object.values(AwardStatus);

  // Current Pursuits columns — no fixed width on text columns, removed Kick-Off button
  const pursuitColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy, whiteSpace: 'nowrap' }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'Source', header: 'Source', sortable: true, render: (r) => (
      <InlineSelect recordId={r.id} field="Source" value={r.Source} options={sourceOptions} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'DeliverableType', header: 'Type', sortable: true, render: (r) => (
      <InlineSelect recordId={r.id} field="DeliverableType" value={r.DeliverableType} options={typeOptions} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'SubBidsDue', header: 'Sub Bids Due', render: (r) => (
      <InlineDate recordId={r.id} field="SubBidsDue" value={r.SubBidsDue} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'PreSubmissionReview', header: 'Pre-Sub Review', render: (r) => (
      <InlineDate recordId={r.id} field="PreSubmissionReview" value={r.PreSubmissionReview} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'WinStrategyMeeting', header: 'Win Strategy', render: (r) => (
      <InlineDate recordId={r.id} field="WinStrategyMeeting" value={r.WinStrategyMeeting} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'DueDate_OutTheDoor', header: 'Due (OTD)', sortable: true, render: (r) => (
      <InlineDate recordId={r.id} field="DueDate_OutTheDoor" value={r.DueDate_OutTheDoor} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, render: (r) => (
      <InlineInput recordId={r.id} field="LeadEstimator" value={r.LeadEstimator || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'Contributors', header: 'Contributors', width: '100px', render: (r) => (
      <InlineInput recordId={r.id} field="Contributors" value={(r.Contributors || []).join(', ')} updateFn={(id, data) => {
        const val = String((data as Record<string, unknown>).Contributors || '');
        return handleInlineUpdate(id, { Contributors: val.split(',').map(s => s.trim()).filter(Boolean) } as unknown as Partial<IEstimatingTracker>);
      }} disabled={!canEdit} />
    )},
    { key: 'PX_ProjectExecutive', header: 'PX', render: (r) => (
      <InlineInput recordId={r.id} field="PX_ProjectExecutive" value={r.PX_ProjectExecutive || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
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
      <InlineNumber recordId={r.id} field="EstimatedCostValue" value={r.EstimatedCostValue} updateFn={handleInlineUpdate} disabled={!canEdit} format={formatCurrencyCompact} />
    )},
  ], [handleCheckToggle, handleInlineUpdate, canEdit, sourceOptions, typeOptions]);

  // Precon Engagements columns
  const preconColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy, whiteSpace: 'nowrap' }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, render: (r) => (
      <InlineInput recordId={r.id} field="LeadEstimator" value={r.LeadEstimator || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'PX_ProjectExecutive', header: 'PX', render: (r) => (
      <InlineInput recordId={r.id} field="PX_ProjectExecutive" value={r.PX_ProjectExecutive || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'DocSetStage', header: 'Doc Stage', sortable: true, render: (r) => (
      <InlineInput recordId={r.id} field="DocSetStage" value={r.DocSetStage || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'CurrentStage', header: 'Current Stage', width: '120px', render: (r) => {
      const lead = r.LeadID ? leadMap.get(r.LeadID) : undefined;
      return lead ? lead.Stage : '-';
    }},
    { key: 'PreconFee', header: 'Precon Budget', sortable: true, width: '110px', render: (r) => (
      <InlineNumber recordId={r.id} field="PreconFee" value={r.PreconFee} updateFn={handleInlineUpdate} disabled={!canEdit} format={v => formatCurrency(v)} />
    )},
    { key: 'DesignBudget', header: 'Design Budget', sortable: true, width: '110px', render: (r) => (
      <InlineNumber recordId={r.id} field="DesignBudget" value={r.DesignBudget} updateFn={handleInlineUpdate} disabled={!canEdit} format={v => formatCurrency(v)} />
    )},
    { key: 'FeePaidToDate', header: 'Billed to Date', sortable: true, width: '110px', render: (r) => (
      <InlineNumber recordId={r.id} field="FeePaidToDate" value={r.FeePaidToDate} updateFn={handleInlineUpdate} disabled={!canEdit} format={v => formatCurrency(v)} />
    )},
    { key: 'Remaining', header: 'Remaining', width: '110px', render: (r) => {
      const remaining = (r.PreconFee || 0) - (r.FeePaidToDate || 0);
      return <span style={{ color: remaining < 0 ? HBC_COLORS.error : HBC_COLORS.gray800, fontWeight: remaining < 0 ? 600 : 400 }}>{formatCurrency(remaining)}</span>;
    }},
  ], [handleInlineUpdate, canEdit, leadMap]);

  // Estimate Log columns
  const logColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', sortable: true, render: (r) => (
      <span style={{ fontWeight: 500, color: HBC_COLORS.navy, whiteSpace: 'nowrap' }}>{r.Title}</span>
    )},
    { key: 'ProjectCode', header: 'Code', sortable: true, width: '90px', render: (r) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.ProjectCode || '-'}</span>
    )},
    { key: 'LeadEstimator', header: 'Estimator', sortable: true, render: (r) => (
      <InlineInput recordId={r.id} field="LeadEstimator" value={r.LeadEstimator || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'EstimateType', header: 'Est. Type', sortable: true, width: '100px', render: (r) => (
      <InlineSelect recordId={r.id} field="EstimateType" value={r.EstimateType} options={typeOptions} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'EstimatedCostValue', header: 'Est. Value', sortable: true, width: '110px', render: (r) => (
      <InlineNumber recordId={r.id} field="EstimatedCostValue" value={r.EstimatedCostValue} updateFn={handleInlineUpdate} disabled={!canEdit} format={formatCurrencyCompact} />
    )},
    { key: 'CostPerGSF', header: '$/GSF', sortable: true, width: '80px', render: (r) => (
      <InlineNumber recordId={r.id} field="CostPerGSF" value={r.CostPerGSF} updateFn={handleInlineUpdate} disabled={!canEdit} format={v => v ? `$${v}` : '-'} />
    )},
    { key: 'CostPerUnit', header: '$/Unit', sortable: true, width: '80px', render: (r) => (
      <InlineNumber recordId={r.id} field="CostPerUnit" value={r.CostPerUnit} updateFn={handleInlineUpdate} disabled={!canEdit} format={v => v ? `$${v.toLocaleString()}` : '-'} />
    )},
    { key: 'SubmittedDate', header: 'Submitted', sortable: true, width: '100px', render: (r) => (
      <InlineDate recordId={r.id} field="SubmittedDate" value={r.SubmittedDate} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'AwardStatus', header: 'Award Status', sortable: true, width: '120px', render: (r) => (
      <InlineSelect recordId={r.id} field="AwardStatus" value={r.AwardStatus} options={awardOptions} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
    { key: 'NotesFeedback', header: 'Notes', width: '150px', render: (r) => (
      <InlineInput recordId={r.id} field="NotesFeedback" value={r.NotesFeedback || ''} updateFn={handleInlineUpdate} disabled={!canEdit} />
    )},
  ], [handleInlineUpdate, canEdit, typeOptions, awardOptions]);

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
          onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}/kickoff`)}
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
            onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}/kickoff`)}
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
            onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}/kickoff`)}
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
