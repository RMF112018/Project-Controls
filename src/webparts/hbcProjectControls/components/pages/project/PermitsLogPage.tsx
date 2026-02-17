import * as React from 'react';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { usePermitsLog } from '../../hooks/usePermitsLog';
import { usePersistedState } from '../../hooks/usePersistedState';
import { IPermit, PermitType, PermitStatus, PERMIT_STATUS_OPTIONS, PERMIT_TYPE_OPTIONS, PERMISSIONS } from '@hbc/sp-services';
import { ExportButtons } from '../../shared/ExportButtons';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useToast } from '../../shared/ToastContainer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_OPTIONS = ['Site', 'Building', 'Pool', 'Parking', 'Utility', 'Other'];

const statusColor = (s: PermitStatus): string => {
  switch (s) {
    case 'Active': return HBC_COLORS.success;
    case 'Pending Application': return HBC_COLORS.warning;
    case 'Pending Revision': return '#D97706';
    case 'Inactive': return HBC_COLORS.gray400;
    case 'VOID': return HBC_COLORS.gray500;
    case 'Expired': return HBC_COLORS.error;
    case 'Closed': return HBC_COLORS.info;
    default: return HBC_COLORS.gray400;
  }
};

const calcDaysToExpiry = (permit: IPermit): number | null => {
  if (!permit.dateExpires) return null;
  const today = new Date();
  const expires = new Date(permit.dateExpires);
  return Math.floor((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isExpiringSoon = (permit: IPermit): boolean => {
  if (permit.status !== 'Active') return false;
  const days = calcDaysToExpiry(permit);
  return days !== null && days >= 0 && days <= 30;
};

const isExpired = (permit: IPermit): boolean => {
  if (permit.status === 'Expired') return true;
  if (permit.status !== 'Active' || !permit.dateExpires) return false;
  const days = calcDaysToExpiry(permit);
  return days !== null && days < 0;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PermitsLogPage: React.FC = () => {
  const { selectedProject, hasPermission } = useAppContext();
  const {
    permits, loading, error, metrics,
    fetchPermits, addPermit, updatePermit, removePermit,
  } = usePermitsLog();
  const { addToast } = useToast();

  const projectCode = selectedProject?.projectCode ?? '';
  const [search, setSearch] = usePersistedState('permits-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('permits-status', 'all');
  const [typeFilter, setTypeFilter] = usePersistedState<string>('permits-type', 'all');
  const [locationFilter, setLocationFilter] = usePersistedState<string>('permits-location', 'all');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<Partial<IPermit>>({});
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState<Partial<IPermit>>({
    location: 'Site',
    type: 'PRIMARY',
    permitNumber: '',
    description: '',
    responsibleContractor: '',
    address: '',
    ahj: '',
    status: 'Pending Application',
  });

  const canEdit = hasPermission(PERMISSIONS.PERMITS_EDIT);
  const canManage = hasPermission(PERMISSIONS.PERMITS_MANAGE);

  React.useEffect(() => {
    if (projectCode) fetchPermits(projectCode).catch(console.error);
  }, [projectCode, fetchPermits]);

  // All unique locations from entries
  const allLocations = React.useMemo(() => {
    const fromEntries = permits.map(p => p.location).filter(Boolean);
    const merged = new Set([...LOCATION_OPTIONS, ...fromEntries]);
    return Array.from(merged);
  }, [permits]);

  const filtered = React.useMemo(() => {
    let list = permits;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.description.toLowerCase().includes(q) ||
        p.refNumber.toLowerCase().includes(q) ||
        p.permitNumber.toLowerCase().includes(q) ||
        p.responsibleContractor.toLowerCase().includes(q) ||
        p.ahj.toLowerCase().includes(q) ||
        (p.comments || '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (locationFilter !== 'all') list = list.filter(p => p.location === locationFilter);
    return list;
  }, [permits, search, statusFilter, typeFilter, locationFilter]);

  // Group filtered entries by location
  const grouped = React.useMemo(() => {
    const groups: Record<string, IPermit[]> = {};
    for (const permit of filtered) {
      const loc = permit.location || 'Other';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(permit);
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ai = LOCATION_OPTIONS.indexOf(a);
      const bi = LOCATION_OPTIONS.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    return sortedKeys.map(key => ({ location: key, items: groups[key] }));
  }, [filtered]);

  const exportData = React.useMemo(() => filtered.map(p => ({
    'REF #': p.refNumber,
    'Parent REF': p.parentRefNumber || '',
    Location: p.location,
    Type: p.type,
    'Permit #': p.permitNumber,
    Description: p.description,
    'Responsible Contractor': p.responsibleContractor,
    Address: p.address,
    'Date Required': p.dateRequired || '',
    'Date Submitted': p.dateSubmitted || '',
    'Date Received': p.dateReceived || '',
    'Date Expires': p.dateExpires || '',
    Status: p.status,
    AHJ: p.ahj,
    Comments: p.comments || '',
  })), [filtered]);

  // ---- inline edit ----
  const startEdit = (entry: IPermit): void => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (): Promise<void> => {
    if (editingId == null) return;
    await updatePermit(projectCode, editingId, editData);
    setEditingId(null);
    setEditData({});
    addToast('Permit updated', 'success');
  };

  // ---- add ----
  const handleAdd = async (): Promise<void> => {
    if (!newEntry.description) return;
    await addPermit(projectCode, newEntry);
    setNewEntry({
      location: 'Site', type: 'PRIMARY', permitNumber: '', description: '',
      responsibleContractor: '', address: '', ahj: '', status: 'Pending Application',
    });
    setShowAddForm(false);
    addToast('Permit added', 'success');
  };

  // ---- remove ----
  const handleRemove = async (entry: IPermit): Promise<void> => {
    await removePermit(projectCode, entry.id);
    addToast('Permit removed', 'success');
  };

  const colCount = canEdit ? 12 : 11;

  // ---- loading / error ----
  if (loading && permits.length === 0) {
    return <SkeletonLoader variant="table" rows={8} columns={6} />;
  }

  if (error) {
    return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.error }}>{error}</div>;
  }

  return (
    <div style={{ padding: '0 0 32px' }} id="permits-log-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: HBC_COLORS.navy }}>Permits Log</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: HBC_COLORS.gray500 }}>
            {projectCode} — Track construction permits and approvals
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddForm(true)} style={btnPrimary}>
            + Add Permit
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Permits" value={String(metrics.total)} color={HBC_COLORS.navy} />
        <MetricCard label="Active" value={String(metrics.active)} color={HBC_COLORS.success} />
        <MetricCard label="Pending" value={String(metrics.pending)} color={HBC_COLORS.warning} />
        <MetricCard label="Expired" value={String(metrics.expired)} color={HBC_COLORS.error} />
        <MetricCard label="Expiring Soon" value={String(metrics.expiringSoon)} color={HBC_COLORS.info} subtitle="Within 30 days" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search permits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="all">All Statuses</option>
          {PERMIT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 140 }}>
          <option value="all">All Types</option>
          {PERMIT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="all">All Locations</option>
          {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <ExportButtons
          pdfElementId="permits-log-page"
          data={exportData}
          filename={`permits-log-${projectCode}`}
          title="Permits Log"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1fr', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <select style={inputStyle} value={newEntry.location || 'Site'} onChange={e => setNewEntry(p => ({ ...p, location: e.target.value }))}>
                {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={newEntry.type || 'PRIMARY'} onChange={e => setNewEntry(p => ({ ...p, type: e.target.value as PermitType }))}>
                {PERMIT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} placeholder="Describe the permit..." value={newEntry.description || ''} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Permit #</label>
              <input style={inputStyle} placeholder="e.g. B-2024-031340" value={newEntry.permitNumber || ''} onChange={e => setNewEntry(p => ({ ...p, permitNumber: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={newEntry.status || 'Pending Application'} onChange={e => setNewEntry(p => ({ ...p, status: e.target.value as PermitStatus }))}>
                {PERMIT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Responsible Contractor</label>
              <input style={inputStyle} placeholder="Contractor name" value={newEntry.responsibleContractor || ''} onChange={e => setNewEntry(p => ({ ...p, responsibleContractor: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} placeholder="Project address" value={newEntry.address || ''} onChange={e => setNewEntry(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>AHJ</label>
              <input style={inputStyle} placeholder="e.g. PBC Building" value={newEntry.ahj || ''} onChange={e => setNewEntry(p => ({ ...p, ahj: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Date Required</label>
              <input type="date" style={inputStyle} value={newEntry.dateRequired || ''} onChange={e => setNewEntry(p => ({ ...p, dateRequired: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button onClick={handleAdd} style={btnPrimary}>Add</button>
              <button onClick={() => setShowAddForm(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: HBC_COLORS.gray50, borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <Th>REF #</Th>
              <Th>Type</Th>
              <Th>Permit #</Th>
              <Th>Description</Th>
              <Th>Responsible Contractor</Th>
              <Th>Status</Th>
              <Th>Date Submitted</Th>
              <Th>Date Received</Th>
              <Th>Date Expires</Th>
              <Th align="right">Days to Expiry</Th>
              <Th>AHJ</Th>
              {canEdit && <Th align="center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {grouped.map(group => (
              <React.Fragment key={group.location}>
                {/* Location header row */}
                <tr>
                  <td colSpan={colCount} style={categoryHeaderStyle}>
                    {group.location} ({group.items.length})
                  </td>
                </tr>
                {/* Data rows */}
                {group.items.map(entry => {
                  const editing = editingId === entry.id;
                  const row = editing ? editData : entry;
                  const daysToExpiry = calcDaysToExpiry(entry);
                  const expiring = isExpiringSoon(entry);
                  const expired = isExpired(entry);
                  const isSub = entry.type === 'SUB';

                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: `1px solid ${HBC_COLORS.gray200}` }}
                      onDoubleClick={() => canEdit && !editing && startEdit(entry)}
                    >
                      {/* REF # */}
                      <Td>
                        <span style={{ paddingLeft: isSub ? 16 : 0, color: isSub ? HBC_COLORS.gray500 : HBC_COLORS.gray700, fontWeight: isSub ? 400 : 600 }}>
                          {entry.refNumber}
                        </span>
                      </Td>

                      {/* Type */}
                      <Td>
                        {editing
                          ? <select style={inlineInput} value={row.type} onChange={e => setEditData(p => ({ ...p, type: e.target.value as PermitType }))}>
                              {PERMIT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          : <span style={{
                              display: 'inline-block', padding: '2px 6px', borderRadius: 4,
                              fontSize: 10, fontWeight: 600, letterSpacing: '0.3px',
                              backgroundColor: entry.type === 'PRIMARY' ? HBC_COLORS.navy : entry.type === 'SUB' ? HBC_COLORS.gray200 : '#FEF3C7',
                              color: entry.type === 'PRIMARY' ? '#fff' : entry.type === 'SUB' ? HBC_COLORS.gray600 : '#92400E',
                            }}>
                              {entry.type}
                            </span>
                        }
                      </Td>

                      {/* Permit # */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 160 }} value={row.permitNumber || ''} onChange={e => setEditData(p => ({ ...p, permitNumber: e.target.value }))} />
                          : <span style={{ fontSize: 12 }}>{entry.permitNumber || '—'}</span>
                        }
                      </Td>

                      {/* Description */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 200 }} value={row.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
                          : <span title={entry.comments || undefined}>{entry.description}</span>
                        }
                      </Td>

                      {/* Responsible Contractor */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 140 }} value={row.responsibleContractor || ''} onChange={e => setEditData(p => ({ ...p, responsibleContractor: e.target.value }))} />
                          : entry.responsibleContractor || '—'
                        }
                      </Td>

                      {/* Status */}
                      <Td>
                        {editing
                          ? <select style={inlineInput} value={row.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value as PermitStatus }))}>
                              {PERMIT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          : <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                              fontSize: 11, fontWeight: 600, color: '#fff',
                              backgroundColor: expired ? HBC_COLORS.error : expiring ? HBC_COLORS.warning : statusColor(entry.status),
                            }}>
                              {expired && entry.status === 'Active' ? 'Expired' : entry.status}
                            </span>
                        }
                      </Td>

                      {/* Date Submitted */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateSubmitted || ''} onChange={e => setEditData(p => ({ ...p, dateSubmitted: e.target.value }))} />
                          : <span style={{ fontSize: 12 }}>{entry.dateSubmitted || '—'}</span>
                        }
                      </Td>

                      {/* Date Received */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateReceived || ''} onChange={e => setEditData(p => ({ ...p, dateReceived: e.target.value }))} />
                          : <span style={{ fontSize: 12, color: entry.dateReceived ? HBC_COLORS.success : HBC_COLORS.gray300 }}>
                              {entry.dateReceived || '—'}
                            </span>
                        }
                      </Td>

                      {/* Date Expires */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateExpires || ''} onChange={e => setEditData(p => ({ ...p, dateExpires: e.target.value }))} />
                          : <span style={{ fontSize: 12, color: expired ? HBC_COLORS.error : expiring ? HBC_COLORS.warning : HBC_COLORS.gray700, fontWeight: (expired || expiring) ? 600 : 400 }}>
                              {entry.dateExpires || '—'}
                            </span>
                        }
                      </Td>

                      {/* Days to Expiry */}
                      <Td align="right">
                        {daysToExpiry !== null ? (
                          <span style={{ fontWeight: 600, color: daysToExpiry < 0 ? HBC_COLORS.error : daysToExpiry <= 30 ? HBC_COLORS.warning : HBC_COLORS.gray700 }}>
                            {daysToExpiry}
                          </span>
                        ) : '—'}
                      </Td>

                      {/* AHJ */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 120 }} value={row.ahj || ''} onChange={e => setEditData(p => ({ ...p, ahj: e.target.value }))} />
                          : <span style={{ fontSize: 12 }}>{entry.ahj || '—'}</span>
                        }
                      </Td>

                      {/* Actions */}
                      {canEdit && (
                        <Td align="center">
                          {editing ? (
                            <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={saveEdit} style={btnSmallPrimary}>Save</button>
                              <button onClick={cancelEdit} style={btnSmallOutline}>Cancel</button>
                            </span>
                          ) : (
                            <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => startEdit(entry)} style={btnSmallOutline}>Edit</button>
                              {canManage && (
                                <button onClick={() => handleRemove(entry)} style={btnSmallDanger}>Del</button>
                              )}
                            </span>
                          )}
                        </Td>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: HBC_COLORS.gray400 }}>
            {permits.length === 0 ? 'No permits recorded yet.' : 'No permits match your filter.'}
          </div>
        )}
      </div>
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

const categoryHeaderStyle: React.CSSProperties = {
  padding: '10px 8px',
  fontWeight: 700,
  fontSize: 13,
  color: HBC_COLORS.navy,
  backgroundColor: HBC_COLORS.gray50,
  borderBottom: `2px solid ${HBC_COLORS.gray200}`,
  letterSpacing: '0.3px',
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

export default PermitsLogPage;
