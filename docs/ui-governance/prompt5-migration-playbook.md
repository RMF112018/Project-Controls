# Prompt 5 Migration Playbook

## Scope
- Tool 1: `EstimatingDashboard` (`/#/preconstruction`, `/#/preconstruction/precon-tracker`, `/#/preconstruction/estimate-log`)
- Tool 2: `ActiveProjectsDashboard` (`/#/operations`)

## Objectives
- Replace direct adapter usage with canonical `HbcDataTable`.
- Add synced chart-to-table and table-to-chart interaction hooks.
- Add persisted personalization and upgraded toasts.
- Preserve non-breaking behavior and route parity.

---

## A) EstimatingDashboard Migration

### Before
```tsx
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';

const pursuitColumns: IHbcTanStackTableColumn<IEstimatingTracker>[] = [/* ... */];

<HbcTanStackTable<IEstimatingTracker>
  columns={pursuitColumns}
  items={currentPursuits}
  keyExtractor={(r) => r.id}
  sortField={sortField}
  sortAsc={sortAsc}
  onSort={handleSort}
/>
```

### After
```tsx
import { HbcDataTable, type IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcEChart } from '../../shared/HbcEChart';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useToast } from '../../shared/ToastContainer';

const [chartFilter, setChartFilter] = usePersistedState('estimating-award-status-filter', 'All');
const [highlightedRowKey, setHighlightedRowKey] = React.useState<string | number | null>(null);

const pursuitColumns: IHbcDataTableColumn<IEstimatingTracker>[] = [/* ... */];

<HbcEChart
  option={awardChartOption}
  ariaLabel="Estimate award status distribution"
  onEvents={{
    click: (params: { name?: string }) => {
      const next = params.name || 'All';
      setChartFilter(next === 'Awarded' ? AwardStatus.AwardedWithPrecon : next);
    },
  }}
/>

<HbcDataTable<IEstimatingTracker>
  tableId="estimating-current-pursuits"
  columns={pursuitColumns}
  items={currentPursuits}
  keyExtractor={(r) => r.id}
  sortField={sortField}
  sortAsc={sortAsc}
  onSort={handleSort}
  linkedChartId="estimating-award-chart"
  onChartLinkHighlight={(payload) => setHighlightedRowKey(payload.rowKey)}
  motion={{ enabled: true, durationMs: 220 }}
/>
```

### Mapping Matrix
| Legacy (`IHbcTanStackTableColumn`) | New (`IHbcDataTableColumn`) | Notes |
|---|---|---|
| `key` | `key` | Unchanged |
| `header` | `header` | Unchanged |
| `render` | `render` | Unchanged render contract |
| `sortable` | `sortable` | Unchanged |
| `width`/`minWidth` | `width`/`minWidth` | Unchanged |
| `hideOnMobile` | `hideOnMobile` | Unchanged |

### Migration Checklist
- [x] Three tabs use `HbcDataTable` only.
- [x] `tableId` persisted per tab.
- [x] Chart click updates award-status filter.
- [x] Row click updates linked highlight state.
- [x] Inline edit toasts now support undo/action options.

---

## B) ActiveProjectsDashboard Migration

### Before
```tsx
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';

const columns: IHbcTanStackTableColumn<IActiveProject>[] = [/* ... */];

<HbcTanStackTable<IActiveProject>
  columns={columns}
  items={filteredProjects}
  keyExtractor={(p) => p.id}
  pageSize={20}
/>
```

### After
```tsx
import { HbcDataTable, type IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useToast } from '../../shared/ToastContainer';
import { useHbcMotionStyles } from '../../shared/HbcMotion';

const [viewMode, setViewMode] = usePersistedState<'standard' | 'datamart'>('active-projects-view-mode', 'standard');
const [showPersonnelPanel, setShowPersonnelPanel] = usePersistedState<boolean>('active-projects-panel-visible', false);
const [highlightedProjectId, setHighlightedProjectId] = React.useState<string | number | null>(null);

const chartEvents = {
  click: (params: { name?: string }) => {
    // maps status/sector/region segment selection to table filters
  },
};

<HbcDataTable<IActiveProject>
  tableId="active-projects-standard"
  columns={columns}
  items={filteredProjects}
  keyExtractor={(p) => p.id}
  linkedChartId="active-projects-overview-chart"
  onChartLinkHighlight={(payload) => setHighlightedProjectId(payload.rowKey)}
  motion={{ enabled: true, durationMs: 220 }}
/>

<HbcDataTable<IProjectDataMart>
  tableId="active-projects-datamart"
  columns={dataMartColumns}
  items={dataMartRecords}
  keyExtractor={(r) => r.id}
  linkedChartId="active-projects-overview-chart"
  onChartLinkHighlight={(payload) => setHighlightedProjectId(payload.rowKey)}
  motion={{ enabled: true, durationMs: 220 }}
/>
```

### Mapping Matrix
| Legacy usage | New usage | Notes |
|---|---|---|
| `HbcTanStackTable<IActiveProject>` | `HbcDataTable<IActiveProject>` | Canonical wrapper adoption |
| `HbcTanStackTable<IProjectDataMart>` | `HbcDataTable<IProjectDataMart>` | Separate persistent `tableId` |
| route-local state | `usePersistedState` | view mode + panel state |
| basic toast | enhanced toast | action/undo/progress support |

### Migration Checklist
- [x] Standard and Data Mart modes use `HbcDataTable`.
- [x] Chart clicks feed filter state.
- [x] Row clicks emit linked chart highlight key.
- [x] Sync action emits progress and action-enabled toast.

---

## Regression Checklist (Both Tools)
- [x] All target routes render with no runtime errors.
- [x] Sort and row interactions remain keyboard-accessible.
- [x] Existing exports and route contracts remain unchanged.
- [x] No direct `@tanstack/react-table` imports introduced in pages.
