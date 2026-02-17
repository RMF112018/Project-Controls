import * as React from 'react';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useConstraintLog } from '../../hooks/useConstraintLog';
import { usePersistedState } from '../../hooks/usePersistedState';
import { IConstraintLog, ConstraintStatus, DEFAULT_CONSTRAINT_CATEGORIES, PERMISSIONS } from '@hbc/sp-services';
import { ExportButtons } from '../../shared/ExportButtons';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useToast } from '../../shared/ToastContainer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const STATUS_OPTIONS: ConstraintStatus[] = ['Open', 'Closed'];

const statusColor = (s: ConstraintStatus): string =>
  s === 'Closed' ? HBC_COLORS.success : HBC_COLORS.warning;

const calcDaysElapsed = (entry: IConstraintLog): number => {
  if (!entry.dateIdentified) return 0;
  const start = new Date(entry.dateIdentified);
  const end = entry.status === 'Closed' && entry.dateClosed
    ? new Date(entry.dateClosed)
    : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const isOverdue = (entry: IConstraintLog): boolean =>
  entry.status === 'Open' && !!entry.dueDate && entry.dueDate < new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ConstraintsLogPage: React.FC = () => {
  const { selectedProject, hasPermission } = useAppContext();
  const {
    entries, loading, error, metrics,
    fetchConstraints, addConstraint, updateConstraint, removeConstraint,
  } = useConstraintLog();
  const { addToast } = useToast();

  const projectCode = selectedProject?.projectCode ?? '';
  const [search, setSearch] = usePersistedState('constraints-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('constraints-status', 'all');
  const [categoryFilter, setCategoryFilter] = usePersistedState<string>('constraints-category', 'all');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editData, setEditData] = React.useState<Partial<IConstraintLog>>({});
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState<Partial<IConstraintLog>>({
    category: 'Other',
    description: '',
    assignedTo: '',
    dueDate: '',
    reference: '',
    budgetImpactCost: 0,
  });

  // Custom categories
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const canEdit = hasPermission(PERMISSIONS.CONSTRAINTS_EDIT);
  const canManage = hasPermission(PERMISSIONS.CONSTRAINTS_MANAGE);

  React.useEffect(() => {
    if (projectCode) fetchConstraints(projectCode).catch(console.error);
  }, [projectCode, fetchConstraints]);

  // Merge defaults + custom + any categories found in existing entries
  const allCategories = React.useMemo(() => {
    const fromEntries = entries.map(e => e.category);
    const merged = new Set([...DEFAULT_CONSTRAINT_CATEGORIES, ...customCategories, ...fromEntries]);
    return Array.from(merged);
  }, [entries, customCategories]);

  const filtered = React.useMemo(() => {
    let list = entries;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.assignedTo.toLowerCase().includes(q) ||
        (e.reference || '').toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter(e => e.category === categoryFilter);
    return list;
  }, [entries, search, statusFilter, categoryFilter]);

  // Group filtered entries by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, IConstraintLog[]> = {};
    for (const entry of filtered) {
      if (!groups[entry.category]) groups[entry.category] = [];
      groups[entry.category].push(entry);
    }
    const defaultOrder = [...DEFAULT_CONSTRAINT_CATEGORIES] as string[];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ai = defaultOrder.indexOf(a);
      const bi = defaultOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    return sortedKeys.map(key => ({ category: key, items: groups[key] }));
  }, [filtered]);

  const exportData = React.useMemo(() => filtered.map(e => ({
    '#': e.constraintNumber,
    Category: e.category,
    Description: e.description,
    Status: e.status,
    'Assigned To': e.assignedTo,
    'Date Identified': e.dateIdentified,
    'Due Date': e.dueDate,
    'Date Closed': e.dateClosed || '',
    'Days Elapsed': calcDaysElapsed(e),
    Reference: e.reference || '',
    'Budget Impact': e.budgetImpactCost || 0,
    Comments: e.comments || '',
  })), [filtered]);

  // ---- inline edit ----
  const startEdit = (entry: IConstraintLog): void => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (): Promise<void> => {
    if (editingId == null) return;
    const updates = { ...editData };
    if (updates.status === 'Closed' && !updates.dateClosed) {
      updates.dateClosed = new Date().toISOString().split('T')[0];
    }
    if (updates.status === 'Open') {
      updates.dateClosed = undefined;
    }
    await updateConstraint(projectCode, editingId, updates);
    setEditingId(null);
    setEditData({});
    addToast('Constraint updated', 'success');
  };

  // ---- add ----
  const handleAdd = async (): Promise<void> => {
    if (!newEntry.description) return;
    await addConstraint(projectCode, {
      ...newEntry,
      dateIdentified: new Date().toISOString().split('T')[0],
    });
    setNewEntry({ category: 'Other', description: '', assignedTo: '', dueDate: '', reference: '', budgetImpactCost: 0 });
    setShowAddForm(false);
    addToast('Constraint added', 'success');
  };

  // ---- add custom category ----
  const handleAddCategory = (): void => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (allCategories.some(c => c.toLowerCase() === name.toLowerCase())) {
      addToast('Category already exists', 'warning');
      return;
    }
    setCustomCategories(prev => [...prev, name]);
    setNewCategoryName('');
    setShowCategoryInput(false);
    addToast(`Category "${name}" created`, 'success');
  };

  // ---- remove ----
  const handleRemove = async (entry: IConstraintLog): Promise<void> => {
    await removeConstraint(projectCode, entry.id);
    addToast('Constraint removed', 'success');
  };

  // Column count for category header colspan
  const colCount = canEdit ? 11 : 10;

  // ---- loading / error ----
  if (loading && entries.length === 0) {
    return <SkeletonLoader variant="table" rows={8} columns={6} />;
  }

  if (error) {
    return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.error }}>{error}</div>;
  }

  return (
    <div style={{ padding: '0 0 32px' }} id="constraints-log-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: HBC_COLORS.navy }}>Constraints Log</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: HBC_COLORS.gray500 }}>
            {projectCode} — Track and resolve construction constraints
          </p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {showCategoryInput ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, width: 180, padding: '6px 10px' }}
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setShowCategoryInput(false); setNewCategoryName(''); } }}
                  autoFocus
                />
                <button onClick={handleAddCategory} style={btnSmallPrimary}>Add</button>
                <button onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }} style={btnSmallOutline}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowCategoryInput(true)} style={btnOutline}>
                + Create Category
              </button>
            )}
            <button onClick={() => setShowAddForm(true)} style={btnPrimary}>
              + Add Constraint
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Constraints" value={String(metrics.total)} color={HBC_COLORS.navy} />
        <MetricCard label="Open" value={String(metrics.open)} color={HBC_COLORS.warning} />
        <MetricCard label="Closed" value={String(metrics.closed)} color={HBC_COLORS.success} />
        <MetricCard label="Overdue" value={String(metrics.overdue)} color={HBC_COLORS.error} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search constraints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...inputStyle, width: 220 }}>
          <option value="all">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <ExportButtons
          pdfElementId="constraints-log-page"
          data={exportData}
          filename={`constraints-log-${projectCode}`}
          title="Constraints Log"
        />
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ ...cardStyle, marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 120px', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={newEntry.category || 'Other'}
                onChange={e => setNewEntry(p => ({ ...p, category: e.target.value }))}
              >
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                style={inputStyle}
                placeholder="Describe the constraint..."
                value={newEntry.description || ''}
                onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Assigned To</label>
              <input
                style={inputStyle}
                placeholder="Name"
                value={newEntry.assignedTo || ''}
                onChange={e => setNewEntry(p => ({ ...p, assignedTo: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                style={inputStyle}
                value={newEntry.dueDate || ''}
                onChange={e => setNewEntry(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Budget Impact ($)</label>
              <input
                type="number"
                style={inputStyle}
                value={newEntry.budgetImpactCost || ''}
                onChange={e => setNewEntry(p => ({ ...p, budgetImpactCost: Number(e.target.value) || 0 }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAdd} style={btnPrimary}>Add</button>
              <button onClick={() => setShowAddForm(false)} style={btnOutline}>Cancel</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Reference</label>
              <input
                style={inputStyle}
                placeholder="Permit #, PO #, etc."
                value={newEntry.reference || ''}
                onChange={e => setNewEntry(p => ({ ...p, reference: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Comments</label>
              <input
                style={inputStyle}
                placeholder="Additional notes..."
                value={newEntry.comments || ''}
                onChange={e => setNewEntry(p => ({ ...p, comments: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: HBC_COLORS.gray50, borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <Th>#</Th>
              <Th>Description</Th>
              <Th>Status</Th>
              <Th>Assigned To</Th>
              <Th>Date Identified</Th>
              <Th>Due Date</Th>
              <Th>Date Closed</Th>
              <Th align="right">Days Elapsed</Th>
              <Th>Reference</Th>
              <Th align="right">Budget Impact</Th>
              {canEdit && <Th align="center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {grouped.map(group => (
              <React.Fragment key={group.category}>
                {/* Category header row */}
                <tr>
                  <td colSpan={colCount} style={categoryHeaderStyle}>
                    {group.category} ({group.items.length})
                  </td>
                </tr>
                {/* Data rows */}
                {group.items.map(entry => {
                  const editing = editingId === entry.id;
                  const row = editing ? editData : entry;
                  const days = calcDaysElapsed(entry);
                  const overdue = isOverdue(entry);

                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: `1px solid ${HBC_COLORS.gray200}` }}
                      onDoubleClick={() => canEdit && !editing && startEdit(entry)}
                    >
                      <Td>{entry.constraintNumber}</Td>

                      {/* Description */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 200 }} value={row.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
                          : <span title={entry.comments || undefined}>{entry.description}</span>
                        }
                      </Td>

                      {/* Status */}
                      <Td>
                        {editing
                          ? <select style={inlineInput} value={row.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value as ConstraintStatus }))}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          : <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                              fontSize: 11, fontWeight: 600, color: '#fff',
                              backgroundColor: overdue ? HBC_COLORS.error : statusColor(entry.status),
                            }}>
                              {overdue ? 'Overdue' : entry.status}
                            </span>
                        }
                      </Td>

                      {/* Assigned To */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 120 }} value={row.assignedTo || ''} onChange={e => setEditData(p => ({ ...p, assignedTo: e.target.value }))} />
                          : entry.assignedTo || '—'
                        }
                      </Td>

                      {/* Date Identified */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateIdentified || ''} onChange={e => setEditData(p => ({ ...p, dateIdentified: e.target.value }))} />
                          : <span style={{ fontSize: 12 }}>{entry.dateIdentified || '—'}</span>
                        }
                      </Td>

                      {/* Due Date */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dueDate || ''} onChange={e => setEditData(p => ({ ...p, dueDate: e.target.value }))} />
                          : <span style={{ fontSize: 12, color: overdue ? HBC_COLORS.error : HBC_COLORS.gray700, fontWeight: overdue ? 600 : 400 }}>
                              {entry.dueDate || '—'}
                            </span>
                        }
                      </Td>

                      {/* Date Closed */}
                      <Td>
                        {editing
                          ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateClosed || ''} onChange={e => setEditData(p => ({ ...p, dateClosed: e.target.value }))} />
                          : <span style={{ fontSize: 12, color: entry.dateClosed ? HBC_COLORS.success : HBC_COLORS.gray300 }}>
                              {entry.dateClosed || '—'}
                            </span>
                        }
                      </Td>

                      {/* Days Elapsed */}
                      <Td align="right">
                        <span style={{ fontWeight: 600, color: overdue ? HBC_COLORS.error : days > 30 ? HBC_COLORS.warning : HBC_COLORS.gray700 }}>
                          {days}
                        </span>
                      </Td>

                      {/* Reference */}
                      <Td>
                        {editing
                          ? <input style={{ ...inlineInput, width: 120 }} value={row.reference || ''} onChange={e => setEditData(p => ({ ...p, reference: e.target.value }))} />
                          : <span style={{ fontSize: 12 }}>{entry.reference || '—'}</span>
                        }
                      </Td>

                      {/* Budget Impact */}
                      <Td align="right">
                        {editing
                          ? <input type="number" style={{ ...inlineInput, width: 100, textAlign: 'right' }}
                              value={row.budgetImpactCost ?? ''}
                              onChange={e => setEditData(p => ({ ...p, budgetImpactCost: Number(e.target.value) || 0 }))}
                            />
                          : <span style={{ color: (entry.budgetImpactCost || 0) > 0 ? HBC_COLORS.error : HBC_COLORS.gray400 }}>
                              {entry.budgetImpactCost ? fmt(entry.budgetImpactCost) : '—'}
                            </span>
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
            {entries.length === 0 ? 'No constraints recorded yet.' : 'No constraints match your filter.'}
          </div>
        )}
      </div>

      {/* Budget Impact Summary */}
      {metrics.totalBIC > 0 && (
        <div style={{ marginTop: 16, padding: '12px 16px', ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: HBC_COLORS.gray600 }}>
            Total Budget Impact (all constraints)
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.error }}>
            {fmt(metrics.totalBIC)}
          </span>
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
