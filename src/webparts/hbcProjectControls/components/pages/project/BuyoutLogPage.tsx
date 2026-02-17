import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useBuyoutLog } from '../../hooks/useBuyoutLog';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useCommitmentApproval } from '../../hooks/useCommitmentApproval';
import { useContractTracking } from '../../hooks/useContractTracking';
import { IBuyoutEntry, BuyoutStatus, CommitmentStatus, ContractTrackingStatus, IResolvedWorkflowStep, PERMISSIONS } from '@hbc/sp-services';
import { CommitmentForm } from './CommitmentForm';
import { CommitmentApprovalPanel } from './CommitmentApprovalPanel';
import { ContractTrackingPanel } from './ContractTrackingPanel';
import { ContractTrackingSubmitModal } from './ContractTrackingSubmitModal';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useToast } from '../../shared/ToastContainer';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const STATUS_OPTIONS: BuyoutStatus[] = ['Not Started', 'In Progress', 'Awarded', 'Executed'];

const statusColor = (s: BuyoutStatus): string => {
  switch (s) {
    case 'Executed': return HBC_COLORS.success;
    case 'Awarded': return '#3B82F6';
    case 'In Progress': return HBC_COLORS.warning;
    default: return HBC_COLORS.gray400;
  }
};

const COMMITMENT_STATUS_CONFIG: Record<CommitmentStatus, { label: string; bg: string; color: string }> = {
  Budgeted: { label: 'Budgeted', bg: HBC_COLORS.gray200, color: HBC_COLORS.gray700 },
  PendingReview: { label: 'Pending Review', bg: HBC_COLORS.warningLight, color: '#92400E' },
  WaiverPending: { label: 'Waiver Pending', bg: '#FFF7ED', color: '#C2410C' },
  PXApproved: { label: 'PX Approved', bg: '#DBEAFE', color: '#1E40AF' },
  ComplianceReview: { label: 'Risk Review', bg: '#F3E8FF', color: '#6B21A8' },
  CFOReview: { label: 'CFO Review', bg: HBC_COLORS.errorLight, color: '#991B1B' },
  Committed: { label: 'Committed', bg: HBC_COLORS.successLight, color: '#065F46' },
  Rejected: { label: 'Rejected', bg: HBC_COLORS.errorLight, color: '#991B1B' },
};

const TRACKING_STATUS_CONFIG: Record<ContractTrackingStatus, { label: string; bg: string; color: string }> = {
  NotStarted:    { label: 'Not Started',   bg: HBC_COLORS.gray200,      color: HBC_COLORS.gray700 },
  PendingAPM:    { label: 'APM/PA',        bg: HBC_COLORS.warningLight, color: '#92400E' },
  PendingPM:     { label: 'PM Review',     bg: '#DBEAFE',               color: '#1E40AF' },
  PendingRiskMgr:{ label: 'Risk Review',   bg: '#F3E8FF',               color: '#6B21A8' },
  PendingPX:     { label: 'PX Review',     bg: '#FEF3C7',               color: '#92400E' },
  Tracked:       { label: 'Tracked',       bg: HBC_COLORS.successLight, color: '#065F46' },
  Rejected:      { label: 'Rejected',      bg: HBC_COLORS.errorLight,   color: '#991B1B' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BuyoutLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedProject, hasPermission, currentUser, dataService, isFeatureEnabled } = useAppContext();
  const { leads, fetchLeads } = useLeads();
  const {
    entries, loading, error, metrics,
    fetchEntries, initializeLog, addEntry, updateEntry, removeEntry,
  } = useBuyoutLog();
  const { submitForApproval, respondToApproval } = useCommitmentApproval();
  const { submitForTracking, respondToTracking, resolveTrackingChain, loading: trackingLoading } = useContractTracking();

  const projectCode = selectedProject?.projectCode ?? '';
  const [search, setSearch] = usePersistedState('buyout-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('buyout-status', 'all');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<Partial<IBuyoutEntry>>({});
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState<Partial<IBuyoutEntry>>({ divisionCode: '', divisionDescription: '' });
  const { addToast } = useToast();

  // Commitment approval modal state
  const [commitmentFormEntry, setCommitmentFormEntry] = React.useState<IBuyoutEntry | null>(null);
  const [approvalDetailEntry, setApprovalDetailEntry] = React.useState<IBuyoutEntry | null>(null);

  // Contract tracking modal state
  const [trackingSubmitEntry, setTrackingSubmitEntry] = React.useState<IBuyoutEntry | null>(null);
  const [trackingDetailEntry, setTrackingDetailEntry] = React.useState<IBuyoutEntry | null>(null);
  const [trackingChain, setTrackingChain] = React.useState<IResolvedWorkflowStep[]>([]);

  const contractTrackingEnabled = isFeatureEnabled('ContractTracking');

  const canEdit = hasPermission(PERMISSIONS.BUYOUT_EDIT);
  const canManage = hasPermission(PERMISSIONS.BUYOUT_MANAGE);
  const canSubmitCommitment = hasPermission(PERMISSIONS.COMMITMENT_SUBMIT);
  const canApprovePX = hasPermission(PERMISSIONS.COMMITMENT_APPROVE_PX);
  const canApproveCompliance = hasPermission(PERMISSIONS.COMMITMENT_APPROVE_COMPLIANCE);
  const canApproveCFO = hasPermission(PERMISSIONS.COMMITMENT_APPROVE_CFO);
  const canEscalate = hasPermission(PERMISSIONS.COMMITMENT_ESCALATE);
  const canSubmitTracking = hasPermission(PERMISSIONS.CONTRACT_TRACKING_SUBMIT);
  const canApproveTrackingAPM = hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_APM);
  const canApproveTrackingPM = hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PM);
  const canApproveTrackingRisk = hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_RISK);
  const canApproveTrackingPX = hasPermission(PERMISSIONS.CONTRACT_TRACKING_APPROVE_PX);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

  React.useEffect(() => {
    if (projectCode) fetchEntries(projectCode).catch(console.error);
  }, [projectCode, fetchEntries]);

  const project = React.useMemo(
    () => leads.find(l => l.ProjectCode === projectCode) ?? null,
    [leads, projectCode],
  );

  const filtered = React.useMemo(() => {
    let list = entries;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.divisionCode.toLowerCase().includes(q) ||
        e.divisionDescription.toLowerCase().includes(q) ||
        (e.subcontractorName || '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    return list;
  }, [entries, search, statusFilter]);

  // ---- initialize if empty ----
  const handleInitialize = async (): Promise<void> => {
    await initializeLog(projectCode);
    addToast('Buyout log initialized', 'success');
  };

  // ---- inline edit ----
  const startEdit = (entry: IBuyoutEntry): void => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (): Promise<void> => {
    if (editingId == null) return;
    await updateEntry(projectCode, editingId, editData);
    setEditingId(null);
    setEditData({});
    addToast('Entry updated', 'success');
  };

  // ---- add custom division ----
  const handleAdd = async (): Promise<void> => {
    if (!newEntry.divisionCode || !newEntry.divisionDescription) return;
    await addEntry(projectCode, { ...newEntry, isStandard: false });
    setNewEntry({ divisionCode: '', divisionDescription: '' });
    setShowAddForm(false);
    addToast('Custom division added', 'success');
  };

  // ---- remove ----
  const handleRemove = async (entry: IBuyoutEntry): Promise<void> => {
    if (!confirm(`Remove "${entry.divisionCode} - ${entry.divisionDescription}"?`)) return;
    await removeEntry(projectCode, entry.id);
    addToast('Division removed', 'success');
  };

  // ---- commitment form submit ----
  const handleCommitmentSubmit = async (data: Partial<IBuyoutEntry>, file?: File): Promise<void> => {
    if (!commitmentFormEntry) return;
    // Upload file if provided
    if (file) {
      try {
        const result = await dataService.uploadCommitmentDocument(projectCode, commitmentFormEntry.id, file);
        data.compiledCommitmentPdfUrl = result.fileUrl;
        data.compiledCommitmentFileId = result.fileId;
        data.compiledCommitmentFileName = result.fileName;
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }
    // Save the checklist data first
    await updateEntry(projectCode, commitmentFormEntry.id, data);
    // Then submit for approval
    const updated = await submitForApproval(projectCode, commitmentFormEntry.id, currentUser?.displayName ?? 'Unknown');
    // Refresh
    await fetchEntries(projectCode);
    setCommitmentFormEntry(null);
    addToast(updated.waiverRequired ? 'Commitment submitted — waiver required' : 'Commitment submitted for review', 'success');
  };

  const handleApprovalAction = async (action: 'approve' | 'reject' | 'escalate', comment: string): Promise<void> => {
    if (!approvalDetailEntry) return;
    await respondToApproval(
      projectCode,
      approvalDetailEntry.id,
      action !== 'reject',
      comment,
      action === 'escalate',
    );
    await fetchEntries(projectCode);
    setApprovalDetailEntry(null);
    const toastType = action === 'reject' ? 'warning' : 'success';
    const msg = action === 'approve' ? 'Commitment approved' : action === 'reject' ? 'Commitment rejected' : 'Escalated to CFO';
    addToast(msg, toastType);
  };

  // ---- contract tracking ----
  const handleOpenTrackingSubmit = async (entry: IBuyoutEntry): Promise<void> => {
    setTrackingSubmitEntry(entry);
    try {
      const chain = await resolveTrackingChain(projectCode);
      setTrackingChain(chain);
    } catch {
      setTrackingChain([]);
    }
  };

  const handleTrackingSubmit = async (): Promise<void> => {
    if (!trackingSubmitEntry) return;
    await submitForTracking(projectCode, trackingSubmitEntry.id, currentUser?.displayName ?? 'Unknown');
    await fetchEntries(projectCode);
    if (!isFeatureEnabled('ContractTrackingDevPreview')) {
      setTrackingSubmitEntry(null);
    }
    addToast('Submitted for contract tracking', 'success');
  };

  const handleTrackingApprove = async (comment: string): Promise<void> => {
    if (!trackingDetailEntry) return;
    await respondToTracking(projectCode, trackingDetailEntry.id, true, comment);
    await fetchEntries(projectCode);
    setTrackingDetailEntry(null);
    addToast('Contract tracking step approved', 'success');
  };

  const handleTrackingReject = async (comment: string): Promise<void> => {
    if (!trackingDetailEntry) return;
    await respondToTracking(projectCode, trackingDetailEntry.id, false, comment);
    await fetchEntries(projectCode);
    setTrackingDetailEntry(null);
    addToast('Contract tracking rejected', 'warning');
  };

  // ---- loading / empty ----
  if (loading && entries.length === 0) {
    return <SkeletonLoader variant="table" rows={8} columns={6} />;
  }

  if (error) {
    return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.error }}>{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.navy, marginBottom: 8 }}>Buyout Log</h2>
        <p style={{ color: HBC_COLORS.gray500, marginBottom: 24 }}>No buyout log has been created for this project yet.</p>
        {canManage && (
          <button onClick={handleInitialize} style={btnPrimary}>
            Initialize Buyout Log
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: HBC_COLORS.navy }}>Buyout Log</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: HBC_COLORS.gray500 }}>
            {project?.Title ?? projectCode} — Budget vs. Actual Tracking
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddForm(true)} style={btnPrimary}>
            + Add Division
          </button>
        )}
      </div>

      {/* Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Original Budget" value={fmt(metrics.totalOriginalBudget)} color="#3B82F6" />
        <MetricCard label="Total Awarded Value" value={fmt(metrics.totalAwardedValue)} color="#8B5CF6" />
        <MetricCard
          label="Total Over / Under"
          value={`${metrics.totalOverUnder >= 0 ? '+' : ''}${fmt(metrics.totalOverUnder)}`}
          color={metrics.totalOverUnder >= 0 ? HBC_COLORS.success : HBC_COLORS.error}
          subtitle={metrics.totalOverUnder >= 0 ? 'Under Budget (Savings)' : 'Over Budget'}
        />
        <MetricCard
          label="Procurement Progress"
          value={`${metrics.procurementProgress}%`}
          color={HBC_COLORS.orange}
          subtitle={`${metrics.awardedDivisions} of ${metrics.totalDivisions} divisions`}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search divisions or subcontractors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Division Code</label>
            <input
              style={inputStyle}
              placeholder="e.g. 09-300"
              value={newEntry.divisionCode || ''}
              onChange={e => setNewEntry(p => ({ ...p, divisionCode: e.target.value }))}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              placeholder="e.g. Tile Work"
              value={newEntry.divisionDescription || ''}
              onChange={e => setNewEntry(p => ({ ...p, divisionDescription: e.target.value }))}
            />
          </div>
          <button onClick={handleAdd} style={btnPrimary}>Add</button>
          <button onClick={() => setShowAddForm(false)} style={btnOutline}>Cancel</button>
        </div>
      )}

      {/* Grid Table */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: HBC_COLORS.gray50, borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <Th>Division</Th>
              <Th>Commitment #</Th>
              <Th>Description</Th>
              <Th align="right">Original Budget</Th>
              <Th align="right">Est. Tax</Th>
              <Th align="right">Total Budget</Th>
              <Th>Subcontractor</Th>
              <Th align="right">Contract Value</Th>
              <Th align="right">Over / Under</Th>
              <Th align="center">SDI</Th>
              <Th align="center">Bond</Th>
              <Th>LOI Sent</Th>
              <Th>LOI Returned</Th>
              <Th>Contract Sent</Th>
              <Th>Contract Exec.</Th>
              <Th>COI Received</Th>
              <Th>Status</Th>
              <Th>Commitment</Th>
              {contractTrackingEnabled && <Th>Tracking</Th>}
              {canEdit && <Th align="center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => {
              const isEditing = editingId === entry.id;
              const row = isEditing ? editData : entry;
              const overUnder = row.overUnder;
              const overUnderColor = overUnder == null
                ? HBC_COLORS.gray400
                : overUnder >= 0 ? HBC_COLORS.success : HBC_COLORS.error;

              return (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray200}` }}
                  onDoubleClick={() => canEdit && !isEditing && startEdit(entry)}
                >
                  <Td>{entry.divisionCode}</Td>
                  <Td>
                    <span
                      onClick={() => navigate('/operations/contract-tracking')}
                      style={{ color: HBC_COLORS.navy, cursor: 'pointer', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                    >
                      {`CMT-${entry.divisionCode}`}
                    </span>
                  </Td>
                  <Td>{entry.divisionDescription}</Td>

                  {/* Original Budget */}
                  <Td align="right">
                    {isEditing
                      ? <input type="number" style={{ ...inlineInput, width: 100, textAlign: 'right' }}
                          value={row.originalBudget ?? 0}
                          onChange={e => setEditData(p => ({ ...p, originalBudget: Number(e.target.value) }))}
                        />
                      : fmt(entry.originalBudget)
                    }
                  </Td>

                  {/* Estimated Tax */}
                  <Td align="right">
                    {isEditing
                      ? <input type="number" style={{ ...inlineInput, width: 80, textAlign: 'right' }}
                          value={row.estimatedTax ?? 0}
                          onChange={e => setEditData(p => ({ ...p, estimatedTax: Number(e.target.value) }))}
                        />
                      : fmt(entry.estimatedTax)
                    }
                  </Td>

                  {/* Total Budget (calculated) */}
                  <Td align="right" bold>{fmt(isEditing ? (row.originalBudget || 0) + (row.estimatedTax || 0) : entry.totalBudget)}</Td>

                  {/* Subcontractor */}
                  <Td>
                    {isEditing
                      ? <input style={{ ...inlineInput, width: 150 }}
                          value={row.subcontractorName ?? ''}
                          onChange={e => setEditData(p => ({ ...p, subcontractorName: e.target.value }))}
                        />
                      : entry.subcontractorName || '—'
                    }
                  </Td>

                  {/* Contract Value */}
                  <Td align="right">
                    {isEditing
                      ? <input type="number" style={{ ...inlineInput, width: 100, textAlign: 'right' }}
                          value={row.contractValue ?? ''}
                          onChange={e => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            setEditData(p => {
                              const tb = (p.originalBudget || 0) + (p.estimatedTax || 0);
                              return { ...p, contractValue: val, overUnder: val != null ? tb - val : undefined };
                            });
                          }}
                        />
                      : entry.contractValue != null ? fmt(entry.contractValue) : '—'
                    }
                  </Td>

                  {/* Over/Under */}
                  <Td align="right">
                    <span style={{ color: overUnderColor, fontWeight: 600 }}>
                      {overUnder != null ? `${overUnder >= 0 ? '+' : ''}${fmt(overUnder)}` : '—'}
                    </span>
                  </Td>

                  {/* SDI */}
                  <Td align="center">
                    {isEditing
                      ? <input type="checkbox" checked={!!row.enrolledInSDI}
                          onChange={e => setEditData(p => ({ ...p, enrolledInSDI: e.target.checked }))}
                        />
                      : <span style={{ color: entry.enrolledInSDI ? HBC_COLORS.success : HBC_COLORS.gray400 }}>
                          {entry.enrolledInSDI ? 'Yes' : 'No'}
                        </span>
                    }
                  </Td>

                  {/* Bond */}
                  <Td align="center">
                    {isEditing
                      ? <input type="checkbox" checked={!!row.bondRequired}
                          onChange={e => setEditData(p => ({ ...p, bondRequired: e.target.checked }))}
                        />
                      : <span style={{ color: entry.bondRequired ? HBC_COLORS.warning : HBC_COLORS.gray400 }}>
                          {entry.bondRequired ? 'Yes' : 'No'}
                        </span>
                    }
                  </Td>

                  {/* Milestone Dates */}
                  <DateCell isEditing={isEditing} value={isEditing ? row.loiSentDate : entry.loiSentDate}
                    onChange={v => setEditData(p => ({ ...p, loiSentDate: v }))} />
                  <DateCell isEditing={isEditing} value={isEditing ? row.loiReturnedDate : entry.loiReturnedDate}
                    onChange={v => setEditData(p => ({ ...p, loiReturnedDate: v }))} />
                  <DateCell isEditing={isEditing} value={isEditing ? row.contractSentDate : entry.contractSentDate}
                    onChange={v => setEditData(p => ({ ...p, contractSentDate: v }))} />
                  <DateCell isEditing={isEditing} value={isEditing ? row.contractExecutedDate : entry.contractExecutedDate}
                    onChange={v => setEditData(p => ({ ...p, contractExecutedDate: v }))} />
                  <DateCell isEditing={isEditing} value={isEditing ? row.insuranceCOIReceivedDate : entry.insuranceCOIReceivedDate}
                    onChange={v => setEditData(p => ({ ...p, insuranceCOIReceivedDate: v }))} />

                  {/* Status */}
                  <Td>
                    {isEditing
                      ? <select style={inlineInput} value={row.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value as BuyoutStatus }))}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      : <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                          fontSize: 11, fontWeight: 600, color: '#fff',
                          backgroundColor: statusColor(entry.status),
                        }}>{entry.status}</span>
                    }
                  </Td>

                  {/* Commitment Status */}
                  <Td>
                    {(() => {
                      const cs = entry.commitmentStatus || 'Budgeted';
                      const cfg = COMMITMENT_STATUS_CONFIG[cs] || COMMITMENT_STATUS_CONFIG.Budgeted;
                      return (
                        <span
                          onClick={() => cs !== 'Budgeted' ? setApprovalDetailEntry(entry) : undefined}
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                            cursor: cs !== 'Budgeted' ? 'pointer' : 'default',
                            textDecoration: cs === 'Rejected' ? 'line-through' : 'none',
                          }}
                        >
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </Td>

                  {/* Contract Tracking Status */}
                  {contractTrackingEnabled && (
                    <Td>
                      {(() => {
                        const ts = entry.contractTrackingStatus || 'NotStarted';
                        const tcfg = TRACKING_STATUS_CONFIG[ts] || TRACKING_STATUS_CONFIG.NotStarted;
                        const isClickable = ts !== 'NotStarted';
                        return (
                          <span
                            onClick={() => isClickable ? setTrackingDetailEntry(entry) : undefined}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 700,
                              backgroundColor: tcfg.bg,
                              color: tcfg.color,
                              cursor: isClickable ? 'pointer' : 'default',
                              textDecoration: ts === 'Rejected' ? 'line-through' : 'none',
                            }}
                          >
                            {tcfg.label}
                          </span>
                        );
                      })()}
                    </Td>
                  )}

                  {/* Actions */}
                  {canEdit && (
                    <Td align="center">
                      {isEditing ? (
                        <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={saveEdit} style={btnSmallPrimary}>Save</button>
                          <button onClick={cancelEdit} style={btnSmallOutline}>Cancel</button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => startEdit(entry)} style={btnSmallOutline}>Edit</button>
                          {canSubmitCommitment && (entry.commitmentStatus === 'Budgeted' || entry.commitmentStatus === undefined) && entry.contractValue != null && entry.contractValue > 0 && (
                            <button onClick={() => setCommitmentFormEntry(entry)} style={btnSmallCommit}>Submit</button>
                          )}
                          {contractTrackingEnabled && canSubmitTracking && entry.commitmentStatus === 'Committed' && (!entry.contractTrackingStatus || entry.contractTrackingStatus === 'NotStarted') && (
                            <button onClick={() => handleOpenTrackingSubmit(entry)} style={btnSmallTrack}>Track</button>
                          )}
                          {canManage && !entry.isStandard && (
                            <button onClick={() => handleRemove(entry)} style={btnSmallDanger}>Del</button>
                          )}
                        </span>
                      )}
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: HBC_COLORS.gray400 }}>
            No divisions match your filter.
          </div>
        )}
      </div>

      {/* Commitment Form Modal */}
      {commitmentFormEntry && (
        <div style={modalOverlay} onClick={() => setCommitmentFormEntry(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <CommitmentForm
              entry={commitmentFormEntry}
              onSubmit={handleCommitmentSubmit}
              onCancel={() => setCommitmentFormEntry(null)}
            />
          </div>
        </div>
      )}

      {/* Approval Detail Modal */}
      {approvalDetailEntry && (
        <div style={modalOverlay} onClick={() => setApprovalDetailEntry(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>
              Commitment Details: {approvalDetailEntry.divisionDescription}
            </h3>
            <CommitmentApprovalPanel
              entry={approvalDetailEntry}
              canApprovePX={canApprovePX}
              canApproveCompliance={canApproveCompliance}
              canApproveCFO={canApproveCFO}
              canEscalate={canEscalate}
              onApprove={comment => handleApprovalAction('approve', comment)}
              onReject={comment => handleApprovalAction('reject', comment)}
              onEscalate={comment => handleApprovalAction('escalate', comment)}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setApprovalDetailEntry(null)} style={btnOutline}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Tracking Submit Modal */}
      {trackingSubmitEntry && (
        <div style={modalOverlay} onClick={() => setTrackingSubmitEntry(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <ContractTrackingSubmitModal
              entry={trackingSubmitEntry}
              resolvedChain={trackingChain}
              loading={trackingLoading}
              onSubmit={handleTrackingSubmit}
              onClose={() => setTrackingSubmitEntry(null)}
            />
          </div>
        </div>
      )}

      {/* Contract Tracking Detail Modal */}
      {trackingDetailEntry && (
        <div style={modalOverlay} onClick={() => setTrackingDetailEntry(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>
              Contract Tracking: {trackingDetailEntry.divisionDescription}
            </h3>
            <ContractTrackingPanel
              entry={trackingDetailEntry}
              canApproveAPM={canApproveTrackingAPM}
              canApprovePM={canApproveTrackingPM}
              canApproveRisk={canApproveTrackingRisk}
              canApprovePX={canApproveTrackingPX}
              onApprove={handleTrackingApprove}
              onReject={handleTrackingReject}
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={() => setTrackingDetailEntry(null)} style={btnOutline}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MetricCard: React.FC<{ label: string; value: string; color: string; subtitle?: string }> = ({ label, value, color, subtitle }) => (
  <div style={{
    ...cardStyle,
    padding: 20,
    ...RISK_INDICATOR.style(color),
  }}>
    <div style={{ fontSize: 12, fontWeight: 500, color: HBC_COLORS.gray500, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {subtitle && <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginTop: 2 }}>{subtitle}</div>}
  </div>
);

const Th: React.FC<{ children: React.ReactNode; align?: string }> = ({ children, align }) => (
  <th style={{ padding: '10px 8px', textAlign: (align as 'left') || 'left', fontWeight: 600, fontSize: 11, color: HBC_COLORS.gray600, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; align?: string; bold?: boolean }> = ({ children, align, bold }) => (
  <td style={{ padding: '8px 8px', textAlign: (align as 'left') || 'left', fontWeight: bold ? 600 : 400, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
    {children}
  </td>
);

const DateCell: React.FC<{ isEditing: boolean; value?: string; onChange: (v: string) => void }> = ({ isEditing, value, onChange }) => (
  <td style={{ padding: '8px 8px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
    {isEditing
      ? <input type="date" style={{ ...inlineInput, width: 120 }} value={value || ''} onChange={e => onChange(e.target.value)} />
      : <span style={{ fontSize: 12, color: value ? HBC_COLORS.gray700 : HBC_COLORS.gray300 }}>{value || '—'}</span>
    }
  </td>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  boxShadow: ELEVATION.level1,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 6,
  fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
};

const inlineInput: React.CSSProperties = {
  padding: '4px 6px', border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 4,
  fontSize: 12, outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray600, marginBottom: 4,
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: HBC_COLORS.orange, color: '#fff',
  border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer',
};

const btnOutline: React.CSSProperties = {
  padding: '8px 20px', backgroundColor: '#fff', color: HBC_COLORS.gray600,
  border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer',
};

const btnSmallPrimary: React.CSSProperties = {
  padding: '3px 10px', backgroundColor: HBC_COLORS.orange, color: '#fff',
  border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 11, cursor: 'pointer',
};

const btnSmallOutline: React.CSSProperties = {
  padding: '3px 10px', backgroundColor: '#fff', color: HBC_COLORS.gray600,
  border: `1px solid ${HBC_COLORS.gray300}`, borderRadius: 4, fontWeight: 500, fontSize: 11, cursor: 'pointer',
};

const btnSmallDanger: React.CSSProperties = {
  padding: '3px 10px', backgroundColor: HBC_COLORS.errorLight, color: HBC_COLORS.error,
  border: `1px solid ${HBC_COLORS.error}`, borderRadius: 4, fontWeight: 600, fontSize: 11, cursor: 'pointer',
};

const btnSmallCommit: React.CSSProperties = {
  padding: '3px 10px', backgroundColor: HBC_COLORS.navy, color: '#fff',
  border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 11, cursor: 'pointer',
};

const btnSmallTrack: React.CSSProperties = {
  padding: '3px 10px', backgroundColor: '#6B21A8', color: '#fff',
  border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 11, cursor: 'pointer',
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: 12, padding: 24,
  maxWidth: 640, width: '90%', maxHeight: '85vh', overflow: 'auto',
  boxShadow: ELEVATION.level4,
};
