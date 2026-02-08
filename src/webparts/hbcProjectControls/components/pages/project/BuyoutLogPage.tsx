import * as React from 'react';
import { HBC_COLORS } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useBuyoutLog } from '../../hooks/useBuyoutLog';
import { IBuyoutEntry, BuyoutStatus } from '../../../models/IBuyoutEntry';
import { PERMISSIONS } from '../../../utils/permissions';

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BuyoutLogPage: React.FC = () => {
  const { siteContext, hasPermission } = useAppContext();
  const { leads, fetchLeads } = useLeads();
  const {
    entries, loading, error, metrics,
    fetchEntries, initializeLog, addEntry, updateEntry, removeEntry,
  } = useBuyoutLog();

  const projectCode = siteContext.projectCode ?? '';
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<Partial<IBuyoutEntry>>({});
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState<Partial<IBuyoutEntry>>({ divisionCode: '', divisionDescription: '' });
  const [toast, setToast] = React.useState<string | null>(null);

  const canEdit = hasPermission(PERMISSIONS.BUYOUT_EDIT);
  const canManage = hasPermission(PERMISSIONS.BUYOUT_MANAGE);

  React.useEffect(() => { fetchLeads().catch(console.error); }, [fetchLeads]);

  React.useEffect(() => {
    if (projectCode) fetchEntries(projectCode).catch(console.error);
  }, [projectCode, fetchEntries]);

  // Auto-clear toast
  React.useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [toast]);

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
    setToast('Buyout log initialized with standard divisions.');
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
    setToast('Entry updated.');
  };

  // ---- add custom division ----
  const handleAdd = async (): Promise<void> => {
    if (!newEntry.divisionCode || !newEntry.divisionDescription) return;
    await addEntry(projectCode, { ...newEntry, isStandard: false });
    setNewEntry({ divisionCode: '', divisionDescription: '' });
    setShowAddForm(false);
    setToast('Custom division added.');
  };

  // ---- remove ----
  const handleRemove = async (entry: IBuyoutEntry): Promise<void> => {
    if (!confirm(`Remove "${entry.divisionCode} - ${entry.divisionDescription}"?`)) return;
    await removeEntry(projectCode, entry.id);
    setToast('Division removed.');
  };

  // ---- loading / empty ----
  if (loading && entries.length === 0) {
    return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray500 }}>Loading buyout log...</div>;
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

                  {/* Actions */}
                  {canEdit && (
                    <Td align="center">
                      {isEditing ? (
                        <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={saveEdit} style={btnSmallPrimary}>Save</button>
                          <button onClick={cancelEdit} style={btnSmallOutline}>Cancel</button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => startEdit(entry)} style={btnSmallOutline}>Edit</button>
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          backgroundColor: HBC_COLORS.navy, color: '#fff', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 14,
        }}>{toast}</div>
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
    borderLeft: `4px solid ${color}`,
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
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
