import * as React from 'react';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useConstraintLog } from '../../hooks/useConstraintLog';
import { usePersistedState } from '../../hooks/usePersistedState';
import { IConstraintLog, ConstraintStatus, DEFAULT_CONSTRAINT_CATEGORIES, PERMISSIONS } from '@hbc/sp-services';
import { ExportButtons } from '../../shared/ExportButtons';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { useToast } from '../../shared/ToastContainer';
import type { EChartsOption } from 'echarts';
import { HbcEChart } from '../../shared/HbcEChart';

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

const daysElapsedColor = (days: number): string => {
  if (days <= 7) return HBC_COLORS.success;
  if (days <= 14) return HBC_COLORS.warning;
  return HBC_COLORS.error;
};

type TabValue = 'all' | 'Open' | 'Closed';
type SortField = 'constraintNumber' | 'description' | 'status' | 'assignedTo' | 'dateIdentified' | 'dueDate' | 'dateClosed' | 'daysElapsed' | 'reference' | 'budgetImpactCost';
type SortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ConstraintsLogPage: React.FC = () => {
  const { selectedProject, hasPermission } = useAppContext();
  const {
    entries, loading, error, metrics,
    fetchConstraints, addConstraint, updateConstraint, removeConstraint,
    hasMore, loadMore, isLoadingMore,
  } = useConstraintLog();
  const { addToast } = useToast();

  const projectCode = selectedProject?.projectCode ?? '';
  const [search, setSearch] = usePersistedState('constraints-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('constraints-status', 'all');
  const [categoryFilter, setCategoryFilter] = usePersistedState<string>('constraints-category', 'all');
  const [activeTab, setActiveTab] = usePersistedState<TabValue>('constraints-tab', 'all');
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

  // Sort state
  const [sortField, setSortField] = React.useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  // Detail modal state
  const [detailEntry, setDetailEntry] = React.useState<IConstraintLog | null>(null);
  const [detailEditing, setDetailEditing] = React.useState(false);
  const [detailEditData, setDetailEditData] = React.useState<Partial<IConstraintLog>>({});
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);

  // Dashboard toggle
  const [showDashboard, setShowDashboard] = usePersistedState('constraints-dashboard', true);

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

  const toggleSort = (field: SortField): void => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filtered = React.useMemo(() => {
    let list = entries;
    // Tab filter
    if (activeTab !== 'all') list = list.filter(e => e.status === activeTab);
    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.assignedTo.toLowerCase().includes(q) ||
        (e.reference || '').toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
      );
    }
    // Status filter (only when tab is 'all')
    if (activeTab === 'all' && statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter(e => e.category === categoryFilter);

    // Sort
    if (sortField) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case 'constraintNumber': cmp = a.constraintNumber - b.constraintNumber; break;
          case 'description': cmp = a.description.localeCompare(b.description); break;
          case 'status': cmp = a.status.localeCompare(b.status); break;
          case 'assignedTo': cmp = a.assignedTo.localeCompare(b.assignedTo); break;
          case 'dateIdentified': cmp = (a.dateIdentified || '').localeCompare(b.dateIdentified || ''); break;
          case 'dueDate': cmp = (a.dueDate || '').localeCompare(b.dueDate || ''); break;
          case 'dateClosed': cmp = (a.dateClosed || '').localeCompare(b.dateClosed || ''); break;
          case 'daysElapsed': cmp = calcDaysElapsed(a) - calcDaysElapsed(b); break;
          case 'reference': cmp = (a.reference || '').localeCompare(b.reference || ''); break;
          case 'budgetImpactCost': cmp = (a.budgetImpactCost || 0) - (b.budgetImpactCost || 0); break;
        }
        return sortDirection === 'desc' ? -cmp : cmp;
      });
    }
    return list;
  }, [entries, search, statusFilter, categoryFilter, activeTab, sortField, sortDirection]);

  // Group filtered entries by category (only when not sorting)
  const grouped = React.useMemo(() => {
    if (sortField) return null; // flat table when sorting
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
  }, [filtered, sortField]);

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

  // ---- Charts data ----
  const categoryChartData = React.useMemo(() => {
    return Object.entries(metrics.byCategoryAndStatus).map(([cat, { open, closed }]) => ({
      category: cat.length > 18 ? cat.slice(0, 16) + '...' : cat,
      Open: open,
      Closed: closed,
    }));
  }, [metrics.byCategoryAndStatus]);

  const statusPieData = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const openNonOverdue = entries.filter(e => e.status === 'Open' && (!e.dueDate || e.dueDate >= today)).length;
    const overdueCount = entries.filter(e => e.status === 'Open' && e.dueDate && e.dueDate < today).length;
    const closedCount = entries.filter(e => e.status === 'Closed').length;
    return [
      { name: 'Open', value: openNonOverdue, color: HBC_COLORS.warning },
      { name: 'Overdue', value: overdueCount, color: HBC_COLORS.error },
      { name: 'Closed', value: closedCount, color: HBC_COLORS.success },
    ].filter(d => d.value > 0);
  }, [entries]);

  // ─── ECharts option memos ─────────────────────────────────────────────────

  const categoryBarOption = React.useMemo<EChartsOption>(() => ({
    grid: { top: 5, right: 20, bottom: 5, left: 20, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: HBC_COLORS.gray600 } },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'category', data: categoryChartData.map(d => d.category), axisLabel: { fontSize: 11, color: HBC_COLORS.gray600 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    series: [
      { type: 'bar', name: 'Open', stack: 'total', data: categoryChartData.map(d => d.Open), itemStyle: { color: HBC_COLORS.warning } },
      { type: 'bar', name: 'Closed', stack: 'total', data: categoryChartData.map(d => d.Closed), itemStyle: { color: HBC_COLORS.success, borderRadius: [0, 4, 4, 0] } },
    ],
  }), [categoryChartData]);

  const statusPieOption = React.useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: (p: unknown) => {
      const params = p as { name: string; value: number; percent: number; marker: string };
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params.marker}${params.name}: ${params.value} (${params.percent}%)</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: HBC_COLORS.gray600 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      paddingAngle: 2,
      label: { formatter: (p: unknown) => { const pi = p as { name: string; percent: number }; return `${pi.name} ${(pi.percent * 100).toFixed(0)}%`; }, fontSize: 11 },
      data: statusPieData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color, borderWidth: 2, borderColor: '#fff' },
      })),
    }],
  }), [statusPieData]);

  // ---- Tab change handler ----
  const handleTabChange = (tab: TabValue): void => {
    setActiveTab(tab);
    if (tab !== 'all') setStatusFilter('all');
  };

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

  // ---- detail modal ----
  const openDetail = (entry: IConstraintLog): void => {
    setDetailEntry(entry);
    setDetailEditing(false);
    setDetailEditData({});
  };

  const closeDetail = (): void => {
    setDetailEntry(null);
    setDetailEditing(false);
    setDetailEditData({});
  };

  const startDetailEdit = (): void => {
    if (!detailEntry) return;
    setDetailEditing(true);
    setDetailEditData({ ...detailEntry });
  };

  const saveDetailEdit = async (): Promise<void> => {
    if (!detailEntry) return;
    const updates = { ...detailEditData };
    if (updates.status === 'Closed' && !updates.dateClosed) {
      updates.dateClosed = new Date().toISOString().split('T')[0];
    }
    if (updates.status === 'Open') {
      updates.dateClosed = undefined;
    }
    const updated = await updateConstraint(projectCode, detailEntry.id, updates);
    setDetailEntry(updated);
    setDetailEditing(false);
    setDetailEditData({});
    addToast('Constraint updated', 'success');
  };

  const confirmDelete = async (): Promise<void> => {
    if (deleteConfirmId == null) return;
    await removeConstraint(projectCode, deleteConfirmId);
    setDeleteConfirmId(null);
    if (detailEntry?.id === deleteConfirmId) closeDetail();
    addToast('Constraint removed', 'success');
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


  // Column count for category header colspan
  const colCount = canEdit ? 11 : 10;

  // ---- Render a data row (shared between grouped and flat) ----
  const renderRow = (entry: IConstraintLog): React.ReactNode => {
    const editing = editingId === entry.id;
    const row = editing ? editData : entry;
    const days = calcDaysElapsed(entry);
    const overdue = isOverdue(entry);

    return (
      <tr
        key={entry.id}
        style={{
          borderBottom: `1px solid ${HBC_COLORS.gray200}`,
          backgroundColor: overdue ? 'rgba(239,68,68,0.04)' : undefined,
          cursor: editing ? undefined : 'pointer',
        }}
        onClick={() => !editing && openDetail(entry)}
        onDoubleClick={e => { e.stopPropagation(); if (canEdit && !editing) startEdit(entry); }}
      >
        <Td>{entry.constraintNumber}</Td>

        {/* Description */}
        <Td>
          {editing
            ? <input style={{ ...inlineInput, width: 200 }} value={row.description || ''} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} onClick={e => e.stopPropagation()} />
            : <span title={entry.comments || undefined}>{entry.description}</span>
          }
        </Td>

        {/* Status */}
        <Td>
          {editing
            ? <select style={inlineInput} value={row.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value as ConstraintStatus }))} onClick={e => e.stopPropagation()}>
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
            ? <input style={{ ...inlineInput, width: 120 }} value={row.assignedTo || ''} onChange={e => setEditData(p => ({ ...p, assignedTo: e.target.value }))} onClick={e => e.stopPropagation()} />
            : entry.assignedTo || '\u2014'
          }
        </Td>

        {/* Date Identified */}
        <Td>
          {editing
            ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateIdentified || ''} onChange={e => setEditData(p => ({ ...p, dateIdentified: e.target.value }))} onClick={e => e.stopPropagation()} />
            : <span style={{ fontSize: 12 }}>{entry.dateIdentified || '\u2014'}</span>
          }
        </Td>

        {/* Due Date */}
        <Td>
          {editing
            ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dueDate || ''} onChange={e => setEditData(p => ({ ...p, dueDate: e.target.value }))} onClick={e => e.stopPropagation()} />
            : <span style={{ fontSize: 12, color: overdue ? HBC_COLORS.error : HBC_COLORS.gray700, fontWeight: overdue ? 600 : 400 }}>
                {entry.dueDate || '\u2014'}
              </span>
          }
        </Td>

        {/* Date Closed */}
        <Td>
          {editing
            ? <input type="date" style={{ ...inlineInput, width: 130 }} value={row.dateClosed || ''} onChange={e => setEditData(p => ({ ...p, dateClosed: e.target.value }))} onClick={e => e.stopPropagation()} />
            : <span style={{ fontSize: 12, color: entry.dateClosed ? HBC_COLORS.success : HBC_COLORS.gray300 }}>
                {entry.dateClosed || '\u2014'}
              </span>
          }
        </Td>

        {/* Days Elapsed */}
        <Td align="right">
          <span style={{ fontWeight: 600, color: overdue ? HBC_COLORS.error : daysElapsedColor(days) }}>
            {days}
          </span>
        </Td>

        {/* Reference */}
        <Td>
          {editing
            ? <input style={{ ...inlineInput, width: 120 }} value={row.reference || ''} onChange={e => setEditData(p => ({ ...p, reference: e.target.value }))} onClick={e => e.stopPropagation()} />
            : <span style={{ fontSize: 12 }}>{entry.reference || '\u2014'}</span>
          }
        </Td>

        {/* Budget Impact */}
        <Td align="right">
          {editing
            ? <input type="number" style={{ ...inlineInput, width: 100, textAlign: 'right' }}
                value={row.budgetImpactCost ?? ''}
                onChange={e => setEditData(p => ({ ...p, budgetImpactCost: Number(e.target.value) || 0 }))}
                onClick={e => e.stopPropagation()}
              />
            : <span style={{ color: (entry.budgetImpactCost || 0) > 0 ? HBC_COLORS.error : HBC_COLORS.gray400 }}>
                {entry.budgetImpactCost ? fmt(entry.budgetImpactCost) : '\u2014'}
              </span>
          }
        </Td>

        {/* Actions */}
        {canEdit && (
          <Td align="center">
            {editing ? (
              <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={saveEdit} style={btnSmallPrimary}>Save</button>
                <button onClick={cancelEdit} style={btnSmallOutline}>Cancel</button>
              </span>
            ) : (
              <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => startEdit(entry)} style={btnSmallOutline}>Edit</button>
                {canManage && (
                  <button onClick={() => setDeleteConfirmId(entry.id)} style={btnSmallDanger}>Del</button>
                )}
              </span>
            )}
          </Td>
        )}
      </tr>
    );
  };

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Total Constraints" value={String(metrics.total)} color={HBC_COLORS.navy} subtitle={`${Object.keys(metrics.byCategory).length} categories`} />
        <MetricCard label="Open" value={String(metrics.open)} color={HBC_COLORS.warning} subtitle={metrics.overdue > 0 ? `${metrics.overdue} overdue` : 'None overdue'} />
        <MetricCard label="Closed" value={String(metrics.closed)} color={HBC_COLORS.success} subtitle={metrics.total > 0 ? `${Math.round((metrics.closed / metrics.total) * 100)}% resolved` : undefined} />
        <MetricCard label="Overdue" value={String(metrics.overdue)} color={HBC_COLORS.error} subtitle={metrics.open > 0 ? `${Math.round((metrics.overdue / metrics.open) * 100)}% of open` : undefined} />
        <MetricCard label="Budget Impact" value={fmt(metrics.totalBIC)} color={metrics.totalBIC > 0 ? HBC_COLORS.error : HBC_COLORS.navy} subtitle={metrics.totalBIC > 0 ? `Across ${entries.filter(e => (e.budgetImpactCost || 0) > 0).length} items` : 'No cost impact'} />
      </div>

      {/* Dashboard Charts */}
      {entries.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={() => setShowDashboard(!showDashboard)} style={btnOutline}>
              {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
            </button>
          </div>
          {showDashboard && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Category Breakdown */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 4 }}>Category Breakdown</div>
                <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginBottom: 12 }}>Open vs Closed by category</div>
                <HbcEChart
                  option={categoryBarOption}
                  height={280}
                  ariaLabel="Constraints open vs closed by category"
                />
              </div>

              {/* Status Distribution */}
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 4 }}>Status Distribution</div>
                <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginBottom: 12 }}>Open, Overdue, and Closed segments</div>
                <HbcEChart
                  option={statusPieOption}
                  height={280}
                  ariaLabel="Constraints status distribution donut"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search constraints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        {activeTab === 'all' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 160 }}>
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
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

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([['all', 'All', metrics.total], ['Open', 'Open', metrics.open], ['Closed', 'Closed', metrics.closed]] as [TabValue, string, number][]).map(([val, label, count]) => (
          <button
            key={val}
            onClick={() => handleTabChange(val)}
            style={{
              padding: '6px 16px',
              border: `1px solid ${activeTab === val ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
              borderRadius: 6,
              backgroundColor: activeTab === val ? HBC_COLORS.navy : '#fff',
              color: activeTab === val ? '#fff' : HBC_COLORS.gray600,
              fontWeight: activeTab === val ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            <span style={{
              backgroundColor: activeTab === val ? 'rgba(255,255,255,0.2)' : HBC_COLORS.gray100,
              borderRadius: 10,
              padding: '1px 8px',
              fontSize: 11,
              fontWeight: 600,
            }}>
              {count}
            </span>
          </button>
        ))}
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
              <SortableTh field="constraintNumber" label="#" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="description" label="Description" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="assignedTo" label="Assigned To" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="dateIdentified" label="Date Identified" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="dueDate" label="Due Date" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="dateClosed" label="Date Closed" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="daysElapsed" label="Days Elapsed" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} align="right" />
              <SortableTh field="reference" label="Reference" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              <SortableTh field="budgetImpactCost" label="Budget Impact" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} align="right" />
              {canEdit && <Th align="center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {grouped
              ? grouped.map(group => (
                  <React.Fragment key={group.category}>
                    <tr>
                      <td colSpan={colCount} style={categoryHeaderStyle}>
                        {group.category} ({group.items.length})
                      </td>
                    </tr>
                    {group.items.map(renderRow)}
                  </React.Fragment>
                ))
              : filtered.map(renderRow)
            }
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: HBC_COLORS.gray400 }}>
            {entries.length === 0 ? 'No constraints recorded yet.' : 'No constraints match your filter.'}
          </div>
        )}
      </div>
      {hasMore && loadMore && (
        <div aria-live="polite" style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button onClick={() => { void loadMore(); }} disabled={isLoadingMore} style={btnOutline}>
            {isLoadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div style={modalOverlay} onClick={closeDetail}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>Constraint #{detailEntry.constraintNumber}</h3>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                  fontSize: 12, fontWeight: 600, color: '#fff',
                  backgroundColor: isOverdue(detailEntry) ? HBC_COLORS.error : statusColor(detailEntry.status),
                }}>
                  {isOverdue(detailEntry) ? 'Overdue' : detailEntry.status}
                </span>
              </div>
              <button onClick={closeDetail} style={{ ...btnSmallOutline, fontSize: 16, padding: '2px 10px', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ModalField label="Category" value={detailEntry.category} editing={detailEditing}
                editElement={<select style={inputStyle} value={detailEditData.category || ''} onChange={e => setDetailEditData(p => ({ ...p, category: e.target.value }))}>{allCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>} />
              <ModalField label="Description" value={detailEntry.description} editing={detailEditing}
                editElement={<input style={inputStyle} value={detailEditData.description || ''} onChange={e => setDetailEditData(p => ({ ...p, description: e.target.value }))} />} />
              <ModalField label="Assigned To" value={detailEntry.assignedTo || '\u2014'} editing={detailEditing}
                editElement={<input style={inputStyle} value={detailEditData.assignedTo || ''} onChange={e => setDetailEditData(p => ({ ...p, assignedTo: e.target.value }))} />} />
              <ModalField label="Status" value={detailEntry.status} editing={detailEditing}
                editElement={<select style={inputStyle} value={detailEditData.status || ''} onChange={e => setDetailEditData(p => ({ ...p, status: e.target.value as ConstraintStatus }))}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>} />
              <ModalField label="Date Identified" value={detailEntry.dateIdentified || '\u2014'} editing={detailEditing}
                editElement={<input type="date" style={inputStyle} value={detailEditData.dateIdentified || ''} onChange={e => setDetailEditData(p => ({ ...p, dateIdentified: e.target.value }))} />} />
              <ModalField label="Due Date" value={detailEntry.dueDate || '\u2014'} editing={detailEditing}
                editElement={<input type="date" style={inputStyle} value={detailEditData.dueDate || ''} onChange={e => setDetailEditData(p => ({ ...p, dueDate: e.target.value }))} />} />
              <ModalField label="Date Closed" value={detailEntry.dateClosed || '\u2014'} editing={detailEditing}
                editElement={<input type="date" style={inputStyle} value={detailEditData.dateClosed || ''} onChange={e => setDetailEditData(p => ({ ...p, dateClosed: e.target.value }))} />} />
              <ModalField label="Days Elapsed" value={String(calcDaysElapsed(detailEntry))} editing={false} editElement={null} />
              <ModalField label="Reference" value={detailEntry.reference || '\u2014'} editing={detailEditing}
                editElement={<input style={inputStyle} value={detailEditData.reference || ''} onChange={e => setDetailEditData(p => ({ ...p, reference: e.target.value }))} />} />
              <ModalField label="Budget Impact" value={detailEntry.budgetImpactCost ? fmt(detailEntry.budgetImpactCost) : '\u2014'} editing={detailEditing}
                editElement={<input type="number" style={inputStyle} value={detailEditData.budgetImpactCost ?? ''} onChange={e => setDetailEditData(p => ({ ...p, budgetImpactCost: Number(e.target.value) || 0 }))} />} />
              <div style={{ gridColumn: '1 / -1' }}>
                <ModalField label="Comments" value={detailEntry.comments || '\u2014'} editing={detailEditing}
                  editElement={<textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={detailEditData.comments || ''} onChange={e => setDetailEditData(p => ({ ...p, comments: e.target.value }))} />} />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${HBC_COLORS.gray200}` }}>
              <div>
                {canManage && !detailEditing && (
                  <button onClick={() => setDeleteConfirmId(detailEntry.id)} style={{ ...btnSmallDanger, padding: '6px 16px', fontSize: 13 }}>
                    Delete
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {detailEditing ? (
                  <>
                    <button onClick={() => { setDetailEditing(false); setDetailEditData({}); }} style={btnOutline}>Cancel</button>
                    <button onClick={saveDetailEdit} style={btnPrimary}>Save</button>
                  </>
                ) : (
                  <>
                    {canEdit && <button onClick={startDetailEdit} style={btnOutline}>Edit</button>}
                    <button onClick={closeDetail} style={btnPrimary}>Close</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmId != null}
        title="Delete Constraint"
        message="Are you sure you want to delete this constraint? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        danger
      />
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

const SortableTh: React.FC<{
  field: SortField;
  label: string;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (f: SortField) => void;
  align?: string;
}> = ({ field, label, sortField, sortDirection, onSort, align }) => {
  const active = sortField === field;
  const arrow = active ? (sortDirection === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '10px 8px',
        textAlign: (align as 'left') || 'left',
        fontWeight: 600,
        fontSize: 11,
        color: active ? HBC_COLORS.navy : HBC_COLORS.gray600,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {label}{arrow}
    </th>
  );
};

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

const ModalField: React.FC<{
  label: string;
  value: string;
  editing: boolean;
  editElement: React.ReactNode;
}> = ({ label, value, editing, editElement }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>{label}</div>
    {editing && editElement ? editElement : <div style={{ fontSize: 14, color: HBC_COLORS.gray700 }}>{value}</div>}
  </div>
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

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContent: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 32,
  width: '90%',
  maxWidth: 720,
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
