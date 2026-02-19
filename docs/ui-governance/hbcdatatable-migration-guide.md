# HbcDataTable Migration Guide

## Purpose
Use `HbcDataTable` as the canonical shared table surface. Keep direct `HbcTanStackTable` usage inside adapter-level code only.

## Example Conversion
Target: `ApplicationSupportPage` legacy table block.

### Before (Direct Adapter Usage)
```tsx
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';

const columns: IHbcTanStackTableColumn<IHelpGuide>[] = [
  { key: 'title', header: 'Guide', render: (item) => item.title, sortable: true },
  { key: 'category', header: 'Category', render: (item) => item.category },
];

<HbcTanStackTable<IHelpGuide>
  columns={columns}
  items={guides}
  keyExtractor={(item) => item.id}
  ariaLabel="Support guides"
  onSort={handleSort}
  sortField={sortField}
  sortAsc={sortAsc}
/>
```

### After (Canonical Shared Wrapper)
```tsx
import { HbcDataTable, type IHbcDataTableColumn } from '../../shared/HbcDataTable';

const columns: IHbcDataTableColumn<IHelpGuide>[] = [
  { key: 'title', header: 'Guide', render: (item) => item.title, sortable: true },
  { key: 'category', header: 'Category', render: (item) => item.category },
];

<HbcDataTable<IHelpGuide>
  tableId="appSupport.guides"
  columns={columns}
  items={guides}
  keyExtractor={(item) => item.id}
  ariaLabel="Support guides"
  onSort={handleSort}
  sortField={sortField}
  sortAsc={sortAsc}
  enableFiltering={true}
  enableColumnVisibility={true}
  enableColumnResize={true}
  enableRowSelection={true}
  enableFormulas={true}
  formulas={[
    { label: 'Total Guides', compute: (items) => items.length },
  ]}
  toolbarSlot={({ filteredItems }) => <span>{filteredItems.length} visible</span>}
/>
```

## Prop Mapping
| Legacy (`HbcTanStackTable`) | New (`HbcDataTable`) | Notes |
|---|---|---|
| `columns` | `columns` | Use `IHbcDataTableColumn<T>` in page/shared UI code. |
| `items` | `items` | Same behavior. |
| `keyExtractor` | `keyExtractor` | Same behavior. |
| `sortField` / `sortAsc` / `onSort` | Same props | Wrapper delegates sort orchestration to adapter. |
| `ariaLabel` | `ariaLabel` | Mandatory for accessibility. |
| (none) | `tableId` | Required for per-table persistence. |
| (none) | `toolbarSlot` / `footerSlot` | Preferred extension points for page-specific UI. |
| (none) | `enableFormulas` / `formulas` | Footer summary and aggregate extension. |

## Persistence Behavior
`HbcDataTable` persists by `tableId` (localStorage):
- density
- global filter
- groupBy
- column visibility
- page index

Disable persistence with `enablePersistence={false}` when required by a route.

## Accessibility Notes
- Always provide a meaningful `ariaLabel`.
- Sorting remains keyboard operable (`Enter`/`Space`) with `aria-sort` states.
- Row activation maintains keyboard parity with click behavior.
- Row-selection checkboxes expose explicit labels.

## Rollout Guidance
1. Convert one table surface at a time.
2. Keep existing page-level data-fetch hooks unchanged.
3. Validate with `npm run lint:governance`, `npx tsc --noEmit`, `npm run build-storybook`, and `npm run test:a11y`.
4. Add/update Storybook stories for each migrated shared usage pattern.
