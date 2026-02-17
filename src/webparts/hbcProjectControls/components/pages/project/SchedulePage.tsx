import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useScheduleActivities } from '../../hooks/useScheduleActivities';
import { useTabFromUrl } from '../../hooks/useTabFromUrl';
import { usePersistedState } from '../../hooks/usePersistedState';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { useToast } from '../../shared/ToastContainer';
import { ScheduleImportModal } from './ScheduleImportModal';
import { ScheduleAnalysisTab } from './ScheduleAnalysisTab';
import { ProjectScheduleCriticalPath } from './ProjectScheduleCriticalPath';
import { HBC_COLORS, ELEVATION, RISK_INDICATOR } from '../../../theme/tokens';
import {
  IScheduleActivity,
  IScheduleImport,
  IScheduleMetrics,
  PERMISSIONS,
  buildBreadcrumbs,
  ActivityStatus,
} from '@hbc/sp-services';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = ['overview', 'activities', 'gantt', 'critical-path', 'analysis', 'import'] as const;
type ScheduleTab = (typeof TABS)[number];
const TAB_LABELS: Record<ScheduleTab, string> = {
  overview: 'Overview',
  activities: 'Activities',
  gantt: 'Gantt',
  'critical-path': 'Critical Path',
  analysis: 'Analysis',
  import: 'Import',
};

const STATUS_OPTIONS: ActivityStatus[] = ['Completed', 'In Progress', 'Not Started'];
const STATUS_COLORS: Record<ActivityStatus, string> = {
  Completed: HBC_COLORS.success,
  'In Progress': HBC_COLORS.warning,
  'Not Started': HBC_COLORS.gray400,
};

type SortField = 'taskCode' | 'activityName' | 'status' | 'originalDuration' | 'remainingFloat' | 'percentComplete';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SchedulePage: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, hasPermission } = useAppContext();
  const {
    activities, imports, isLoading, error, metrics,
    fetchActivities, fetchImports, importActivities,
  } = useScheduleActivities();
  const { addToast } = useToast();

  const projectCode = selectedProject?.projectCode ?? '';
  const canView = hasPermission(PERMISSIONS.SCHEDULE_VIEW);
  const canImport = hasPermission(PERMISSIONS.SCHEDULE_IMPORT);

  const [activeTab, setTab] = useTabFromUrl<ScheduleTab>('overview', TABS);

  // Filters
  const [search, setSearch] = usePersistedState('schedule-search', '');
  const [statusFilter, setStatusFilter] = usePersistedState<string>('schedule-status', 'all');
  const [criticalOnly, setCriticalOnly] = usePersistedState<boolean>('schedule-critical', false);
  const [wbsFilter, setWbsFilter] = usePersistedState<string>('schedule-wbs', 'all');
  const [dateStart, setDateStart] = usePersistedState<string>('schedule-date-start', '');
  const [dateEnd, setDateEnd] = usePersistedState<string>('schedule-date-end', '');
  const [floatMin, setFloatMin] = usePersistedState<string>('schedule-float-min', '');
  const [floatMax, setFloatMax] = usePersistedState<string>('schedule-float-max', '');
  const [actTypeFilter, setActTypeFilter] = usePersistedState<string>('schedule-acttype', 'all');

  // Sort
  const [sortField, setSortField] = React.useState<SortField>('taskCode');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  // Import modal
  const [showImport, setShowImport] = React.useState(false);

  // Load data
  React.useEffect(() => {
    if (projectCode) {
      fetchActivities(projectCode).catch(console.error);
      fetchImports(projectCode).catch(console.error);
    }
  }, [projectCode, fetchActivities, fetchImports]);

  // Distinct values for dropdown filters
  const wbsPrefixes = React.useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.wbsCode) {
        const parts = a.wbsCode.split('.');
        set.add(parts.slice(0, 2).join('.'));
      }
    });
    return Array.from(set).sort();
  }, [activities]);

  const activityTypes = React.useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => { if (a.activityType) set.add(a.activityType); });
    return Array.from(set).sort();
  }, [activities]);

  // Filtered + sorted activities
  const filtered = React.useMemo(() => {
    let list = activities;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.taskCode.toLowerCase().includes(q) ||
        a.activityName.toLowerCase().includes(q) ||
        a.wbsCode.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (criticalOnly) list = list.filter(a => a.isCritical);
    if (wbsFilter !== 'all') list = list.filter(a => a.wbsCode.startsWith(wbsFilter));
    if (actTypeFilter !== 'all') list = list.filter(a => a.activityType === actTypeFilter);
    if (dateStart) {
      const ds = new Date(dateStart).getTime();
      list = list.filter(a => {
        const d = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : null;
        return d !== null && d >= ds;
      });
    }
    if (dateEnd) {
      const de = new Date(dateEnd).getTime();
      list = list.filter(a => {
        const d = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : null;
        return d !== null && d <= de;
      });
    }
    if (floatMin !== '') {
      const fMin = parseFloat(floatMin);
      if (!isNaN(fMin)) list = list.filter(a => a.remainingFloat !== null && a.remainingFloat >= fMin);
    }
    if (floatMax !== '') {
      const fMax = parseFloat(floatMax);
      if (!isNaN(fMax)) list = list.filter(a => a.remainingFloat !== null && a.remainingFloat <= fMax);
    }

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [activities, search, statusFilter, criticalOnly, wbsFilter, actTypeFilter, dateStart, dateEnd, floatMin, floatMax, sortField, sortDir]);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleImport = async (parsedActivities: IScheduleActivity[], meta: Partial<IScheduleImport>): Promise<void> => {
    await importActivities(projectCode, parsedActivities, meta);
    addToast(`Imported ${parsedActivities.length} activities`, 'success');
  };

  // Critical activities subset
  const criticalActivities = React.useMemo(
    () => activities.filter(a => a.isCritical),
    [activities],
  );

  // Gantt date range
  const ganttRange = React.useMemo(() => {
    const starts = activities
      .map(a => a.plannedStartDate || a.actualStartDate)
      .filter(Boolean) as string[];
    const ends = activities
      .map(a => a.plannedFinishDate || a.actualFinishDate)
      .filter(Boolean) as string[];
    if (starts.length === 0 || ends.length === 0) return null;
    const min = new Date(starts.sort()[0]);
    const max = new Date(ends.sort()[ends.length - 1]);
    const totalDays = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / 86400000));
    return { min, max, totalDays };
  }, [activities]);

  // ---- Render ----
  if (isLoading && activities.length === 0) return <SkeletonLoader variant="table" rows={8} columns={6} />;
  if (error) return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.error }}>{error}</div>;

  return (
    <div>
      <PageHeader
        title="Schedule Management"
        subtitle={projectCode}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={canImport ? (
          <button onClick={() => setShowImport(true)} style={btnPrimary}>Import Schedule</button>
        ) : undefined}
      />

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${HBC_COLORS.gray200}`, marginBottom: 24 }}>
        {TABS.map(tab => {
          if (tab === 'import' && !canImport) return null;
          return (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? HBC_COLORS.navy : HBC_COLORS.gray500,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${HBC_COLORS.orange}` : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -2,
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab metrics={metrics} activities={activities} />
      )}

      {activeTab === 'activities' && (
        <ActivitiesTab
          filtered={filtered}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          criticalOnly={criticalOnly}
          onCriticalOnlyChange={setCriticalOnly}
          wbsFilter={wbsFilter}
          onWbsFilterChange={setWbsFilter}
          wbsPrefixes={wbsPrefixes}
          actTypeFilter={actTypeFilter}
          onActTypeFilterChange={setActTypeFilter}
          activityTypes={activityTypes}
          dateStart={dateStart}
          onDateStartChange={setDateStart}
          dateEnd={dateEnd}
          onDateEndChange={setDateEnd}
          floatMin={floatMin}
          onFloatMinChange={setFloatMin}
          floatMax={floatMax}
          onFloatMaxChange={setFloatMax}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          canView={canView}
          projectCode={projectCode}
        />
      )}

      {activeTab === 'gantt' && (
        <GanttTab
          activities={filtered}
          ganttRange={ganttRange}
        />
      )}

      {activeTab === 'critical-path' && (
        <CriticalPathTab criticalActivities={criticalActivities} />
      )}

      {activeTab === 'analysis' && (
        <ScheduleAnalysisTab activities={activities} metrics={metrics} />
      )}

      {activeTab === 'import' && canImport && (
        <ImportTab
          imports={imports}
          onOpenImport={() => setShowImport(true)}
        />
      )}

      {/* Import Modal */}
      <ScheduleImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        projectCode={projectCode}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

interface IOverviewTabProps {
  metrics: IScheduleMetrics;
  activities: IScheduleActivity[];
}

const OverviewTab: React.FC<IOverviewTabProps> = ({ metrics, activities }) => {
  if (activities.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>
        No schedule data. Import a schedule file to get started.
      </div>
    );
  }

  const { earnedValueMetrics: ev } = metrics;

  return (
    <>
      {/* KPI Cards — Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard label="Total Activities" value={String(metrics.totalActivities)} color={HBC_COLORS.navy} />
        <MetricCard label="% Complete" value={`${metrics.percentComplete}%`} color="#3B82F6" />
        <MetricCard label="Critical Activities" value={String(metrics.criticalActivityCount)} color={HBC_COLORS.error} subtitle={`${metrics.negativeFloatCount} negative float`} />
        <MetricCard label="Avg Float" value={`${metrics.averageFloat}d`} color={metrics.averageFloat < 5 ? HBC_COLORS.error : metrics.averageFloat < 15 ? HBC_COLORS.warning : HBC_COLORS.success} />
        <MetricCard label="SPI (approx)" value={metrics.spiApproximation !== null ? String(metrics.spiApproximation) : 'N/A'} color={metrics.spiApproximation !== null && metrics.spiApproximation >= 1.0 ? HBC_COLORS.success : HBC_COLORS.warning} />
      </div>

      {/* KPI Cards — Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <MetricCard label="CPI" value={ev.cpi !== null ? String(ev.cpi) : 'N/A'} color={ev.cpi !== null && ev.cpi >= 1.0 ? HBC_COLORS.success : HBC_COLORS.warning} subtitle="Cost Performance Index" />
        <MetricCard label="Neg Float %" value={`${metrics.negativeFloatPercent}%`} color={metrics.negativeFloatPercent > 10 ? HBC_COLORS.error : metrics.negativeFloatPercent > 5 ? HBC_COLORS.warning : HBC_COLORS.success} />
        <MetricCard label="Schedule Var" value={`${ev.sv >= 0 ? '+' : ''}${ev.sv}d`} color={ev.sv >= 0 ? HBC_COLORS.success : HBC_COLORS.error} subtitle={`EV: ${ev.ev}d / PV: ${ev.pv}d`} />
        <MetricCard label="Open Ends" value={String(metrics.logicMetrics.openEnds.noPredecessor + metrics.logicMetrics.openEnds.noSuccessor)} color={HBC_COLORS.info} subtitle={`${metrics.logicMetrics.openEnds.noPredecessor} no pred, ${metrics.logicMetrics.openEnds.noSuccessor} no succ`} />
      </div>

      {/* Status Distribution Bar */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 12 }}>Status Distribution</div>
        <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
          {metrics.completedCount > 0 && (
            <div style={{ flex: metrics.completedCount, backgroundColor: HBC_COLORS.success, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {metrics.completedCount}
            </div>
          )}
          {metrics.inProgressCount > 0 && (
            <div style={{ flex: metrics.inProgressCount, backgroundColor: HBC_COLORS.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {metrics.inProgressCount}
            </div>
          )}
          {metrics.notStartedCount > 0 && (
            <div style={{ flex: metrics.notStartedCount, backgroundColor: HBC_COLORS.gray400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              {metrics.notStartedCount}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: HBC_COLORS.success, marginRight: 4 }} />Completed ({metrics.completedCount})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: HBC_COLORS.warning, marginRight: 4 }} />In Progress ({metrics.inProgressCount})</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: HBC_COLORS.gray400, marginRight: 4 }} />Not Started ({metrics.notStartedCount})</span>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Activities Tab
// ---------------------------------------------------------------------------

interface IActivitiesTabProps {
  filtered: IScheduleActivity[];
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  criticalOnly: boolean;
  onCriticalOnlyChange: (v: boolean) => void;
  wbsFilter: string;
  onWbsFilterChange: (v: string) => void;
  wbsPrefixes: string[];
  actTypeFilter: string;
  onActTypeFilterChange: (v: string) => void;
  activityTypes: string[];
  dateStart: string;
  onDateStartChange: (v: string) => void;
  dateEnd: string;
  onDateEndChange: (v: string) => void;
  floatMin: string;
  onFloatMinChange: (v: string) => void;
  floatMax: string;
  onFloatMaxChange: (v: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  canView: boolean;
  projectCode: string;
}

const ActivitiesTab: React.FC<IActivitiesTabProps> = ({
  filtered, search, onSearchChange, statusFilter, onStatusFilterChange,
  criticalOnly, onCriticalOnlyChange,
  wbsFilter, onWbsFilterChange, wbsPrefixes,
  actTypeFilter, onActTypeFilterChange, activityTypes,
  dateStart, onDateStartChange, dateEnd, onDateEndChange,
  floatMin, onFloatMinChange, floatMax, onFloatMaxChange,
  sortField, sortDir, onSort, projectCode,
}) => {
  const exportData = React.useMemo(() =>
    filtered.map(a => ({
      'Activity ID': a.taskCode,
      'WBS': a.wbsCode,
      'Name': a.activityName,
      'Status': a.status,
      'Orig Duration': a.originalDuration,
      'Remaining': a.remainingDuration,
      'Start': a.plannedStartDate || a.actualStartDate || '',
      'Finish': a.plannedFinishDate || a.actualFinishDate || '',
      'Float': a.remainingFloat,
      '% Complete': a.percentComplete,
      'Critical': a.isCritical ? 'Yes' : 'No',
    } as Record<string, unknown>)),
  [filtered]);

  return (
  <>
    {/* Filters — Row 1 */}
    <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Search activities..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        style={{ ...inputStyle, flex: 1 }}
      />
      <select value={statusFilter} onChange={e => onStatusFilterChange(e.target.value)} style={{ ...inputStyle, width: 150 }}>
        <option value="all">All Statuses</option>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {wbsPrefixes.length > 0 && (
        <select value={wbsFilter} onChange={e => onWbsFilterChange(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="all">All WBS</option>
          {wbsPrefixes.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      )}
      {activityTypes.length > 1 && (
        <select value={actTypeFilter} onChange={e => onActTypeFilterChange(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="all">All Types</option>
          {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        <input type="checkbox" checked={criticalOnly} onChange={e => onCriticalOnlyChange(e.target.checked)} />
        Critical Only
      </label>
    </div>

    {/* Filters — Row 2: Date range + Float range */}
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
      <label style={{ fontSize: 12, color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>Start from:</label>
      <input type="date" value={dateStart} onChange={e => onDateStartChange(e.target.value)} style={{ ...inputStyle, width: 140 }} />
      <label style={{ fontSize: 12, color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>to:</label>
      <input type="date" value={dateEnd} onChange={e => onDateEndChange(e.target.value)} style={{ ...inputStyle, width: 140 }} />
      <div style={{ width: 1, height: 20, backgroundColor: HBC_COLORS.gray200 }} />
      <label style={{ fontSize: 12, color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>Float:</label>
      <input type="number" placeholder="Min" value={floatMin} onChange={e => onFloatMinChange(e.target.value)} style={{ ...inputStyle, width: 70 }} />
      <span style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>-</span>
      <input type="number" placeholder="Max" value={floatMax} onChange={e => onFloatMaxChange(e.target.value)} style={{ ...inputStyle, width: 70 }} />
      <div style={{ flex: 1 }} />
      <ExportButtons
        pdfElementId="schedule-activities-table"
        data={exportData}
        filename={`schedule-activities-${projectCode}`}
        title="Schedule Activities"
      />
    </div>

    <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 8 }}>
      Showing {filtered.length} activities
    </div>

    {/* Table */}
    <div id="schedule-activities-table" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
            <ThSort field="taskCode" current={sortField} dir={sortDir} onSort={onSort}>Activity ID</ThSort>
            <Th>WBS</Th>
            <ThSort field="activityName" current={sortField} dir={sortDir} onSort={onSort}>Name</ThSort>
            <ThSort field="status" current={sortField} dir={sortDir} onSort={onSort}>Status</ThSort>
            <ThSort field="originalDuration" current={sortField} dir={sortDir} onSort={onSort}>Orig Dur</ThSort>
            <Th>Remaining</Th>
            <Th>Start</Th>
            <Th>Finish</Th>
            <ThSort field="remainingFloat" current={sortField} dir={sortDir} onSort={onSort}>Float</ThSort>
            <ThSort field="percentComplete" current={sortField} dir={sortDir} onSort={onSort}>% Complete</ThSort>
            <Th align="center">Critical</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}`, backgroundColor: a.isCritical ? '#FEF2F2' : undefined }}>
              <Td bold>{a.taskCode}</Td>
              <Td><span style={{ fontSize: 11, color: HBC_COLORS.gray500 }}>{a.wbsCode}</span></Td>
              <Td>{a.activityName}</Td>
              <Td>
                <StatusBadge status={a.status} />
              </Td>
              <Td align="center">{a.originalDuration}d</Td>
              <Td align="center">{a.remainingDuration}d</Td>
              <Td>{formatDate(a.plannedStartDate || a.actualStartDate)}</Td>
              <Td>{formatDate(a.plannedFinishDate || a.actualFinishDate)}</Td>
              <Td align="center">
                <FloatBadge value={a.remainingFloat} />
              </Td>
              <Td align="center">{a.percentComplete}%</Td>
              <Td align="center">{a.isCritical ? <span style={{ color: HBC_COLORS.error, fontWeight: 700 }}>&#9679;</span> : ''}</Td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={11} style={{ padding: 24, textAlign: 'center', color: HBC_COLORS.gray400 }}>No matching activities</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </>
  );
};

// ---------------------------------------------------------------------------
// Gantt Tab
// ---------------------------------------------------------------------------

interface IGanttTabProps {
  activities: IScheduleActivity[];
  ganttRange: { min: Date; max: Date; totalDays: number } | null;
}

const GanttTab: React.FC<IGanttTabProps> = ({ activities, ganttRange }) => {
  if (!ganttRange || activities.length === 0) {
    return <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>No activities to display in Gantt view.</div>;
  }

  const { min, totalDays } = ganttRange;
  const today = new Date();
  const todayOffset = Math.max(0, Math.min(100, ((today.getTime() - min.getTime()) / 86400000 / totalDays) * 100));

  // Show first 50 activities for performance
  const visible = activities.slice(0, 50);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 8 }}>
        Showing {visible.length} of {activities.length} activities
      </div>
      <div style={{ display: 'flex', minWidth: 900 }}>
        {/* Left: activity names */}
        <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${HBC_COLORS.gray200}` }}>
          <div style={{ height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: HBC_COLORS.gray600, borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
            Activity
          </div>
          {visible.map(a => (
            <div
              key={a.id}
              style={{
                height: 28,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 11,
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                backgroundColor: a.isCritical ? '#FEF2F2' : undefined,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={a.activityName}
            >
              {a.taskCode}
            </div>
          ))}
        </div>

        {/* Right: timeline bars */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Header */}
          <div style={{ height: 32, borderBottom: `2px solid ${HBC_COLORS.gray200}`, position: 'relative' }}>
            <GanttMonthHeaders min={min} totalDays={totalDays} />
          </div>

          {/* Today line */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${todayOffset}%`,
            width: 1, backgroundColor: HBC_COLORS.error,
            zIndex: 2,
          }} />

          {/* Bars */}
          {visible.map(a => {
            const startStr = a.plannedStartDate || a.actualStartDate;
            const endStr = a.plannedFinishDate || a.actualFinishDate;
            if (!startStr || !endStr) {
              return <div key={a.id} style={{ height: 28, borderBottom: `1px solid ${HBC_COLORS.gray100}` }} />;
            }
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            const leftPct = ((startDate.getTime() - min.getTime()) / 86400000 / totalDays) * 100;
            const widthPct = Math.max(0.5, ((endDate.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100);

            return (
              <div key={a.id} style={{ height: 28, borderBottom: `1px solid ${HBC_COLORS.gray100}`, position: 'relative', backgroundColor: a.isCritical ? '#FEF2F2' : undefined }}>
                <div
                  title={`${a.activityName} (${a.originalDuration}d)`}
                  style={{
                    position: 'absolute',
                    top: 5,
                    left: `${Math.max(0, leftPct)}%`,
                    width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                    height: 18,
                    borderRadius: 3,
                    backgroundColor: a.isCritical ? HBC_COLORS.error : STATUS_COLORS[a.status],
                    opacity: 0.85,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const GanttMonthHeaders: React.FC<{ min: Date; totalDays: number }> = ({ min, totalDays }) => {
  const months: { label: string; leftPct: number }[] = [];
  const d = new Date(min.getFullYear(), min.getMonth(), 1);
  const endMs = min.getTime() + totalDays * 86400000;
  while (d.getTime() < endMs) {
    const offset = (d.getTime() - min.getTime()) / 86400000;
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      leftPct: (offset / totalDays) * 100,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return (
    <>
      {months.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.max(0, m.leftPct)}%`,
            top: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            fontSize: 10,
            color: HBC_COLORS.gray500,
            paddingLeft: 4,
            borderLeft: `1px solid ${HBC_COLORS.gray200}`,
          }}
        >
          {m.label}
        </div>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Critical Path Tab
// ---------------------------------------------------------------------------

interface ICriticalPathTabProps {
  criticalActivities: IScheduleActivity[];
}

const CriticalPathTab: React.FC<ICriticalPathTabProps> = ({ criticalActivities }) => (
  <>
    {/* Existing critical path concerns component */}
    <ProjectScheduleCriticalPath />

    {/* Critical activities from imported schedule */}
    {criticalActivities.length > 0 && (
      <div style={{ ...cardStyle, marginTop: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 12 }}>
          Critical Activities ({criticalActivities.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
                <Th>Activity ID</Th>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th align="center">Duration</Th>
                <Th>Start</Th>
                <Th>Finish</Th>
                <Th align="center">Float</Th>
              </tr>
            </thead>
            <tbody>
              {criticalActivities.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}`, backgroundColor: '#FEF2F2' }}>
                  <Td bold>{a.taskCode}</Td>
                  <Td>{a.activityName}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td align="center">{a.originalDuration}d</Td>
                  <Td>{formatDate(a.plannedStartDate || a.actualStartDate)}</Td>
                  <Td>{formatDate(a.plannedFinishDate || a.actualFinishDate)}</Td>
                  <Td align="center"><FloatBadge value={a.remainingFloat} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>
);

// ---------------------------------------------------------------------------
// Import Tab
// ---------------------------------------------------------------------------

interface IImportTabProps {
  imports: IScheduleImport[];
  onOpenImport: () => void;
}

const ImportTab: React.FC<IImportTabProps> = ({ imports, onOpenImport }) => (
  <>
    <div style={{ marginBottom: 24 }}>
      <button onClick={onOpenImport} style={btnPrimary}>Upload Schedule File</button>
    </div>

    {imports.length > 0 && (
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 12 }}>Import History</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <Th>Date</Th>
              <Th>File</Th>
              <Th>Format</Th>
              <Th align="center">Activities</Th>
              <Th>Imported By</Th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {imports.map(imp => (
              <tr key={imp.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                <Td>{new Date(imp.importDate).toLocaleDateString()}</Td>
                <Td bold>{imp.fileName}</Td>
                <Td>{imp.format}</Td>
                <Td align="center">{imp.activityCount}</Td>
                <Td>{imp.importedBy}</Td>
                <Td><span style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>{imp.notes || '-'}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {imports.length === 0 && (
      <div style={{ padding: 32, textAlign: 'center', color: HBC_COLORS.gray400, fontSize: 13 }}>
        No imports yet. Upload a schedule file (CSV, XER, or XML) to get started.
      </div>
    )}
  </>
);

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

const MetricCard: React.FC<{ label: string; value: string; color: string; subtitle?: string }> = ({ label, value, color, subtitle }) => (
  <div style={{ ...cardStyle, padding: 20, ...RISK_INDICATOR.style(color) }}>
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

const ThSort: React.FC<{ children: React.ReactNode; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void }> = ({ children, field, current, dir, onSort }) => (
  <th
    onClick={() => onSort(field)}
    style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: HBC_COLORS.gray600, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
  >
    {children} {current === field ? (dir === 'asc' ? '\u25B2' : '\u25BC') : ''}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; align?: string; bold?: boolean }> = ({ children, align, bold }) => (
  <td style={{ padding: '8px 8px', textAlign: (align as 'left') || 'left', fontWeight: bold ? 600 : 400, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
    {children}
  </td>
);

const StatusBadge: React.FC<{ status: ActivityStatus }> = ({ status }) => (
  <span style={{
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: `${STATUS_COLORS[status]}20`,
    color: STATUS_COLORS[status],
  }}>
    {status}
  </span>
);

const FloatBadge: React.FC<{ value: number | null }> = ({ value }) => {
  if (value === null) return <span style={{ color: HBC_COLORS.gray400 }}>-</span>;
  const color = value < 0 ? HBC_COLORS.error : value === 0 ? HBC_COLORS.warning : value <= 10 ? '#D97706' : HBC_COLORS.success;
  return <span style={{ fontWeight: 600, color }}>{value}d</span>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (d: string | null): string => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 20,
  marginBottom: 16,
  boxShadow: ELEVATION.level1,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: HBC_COLORS.orange,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
