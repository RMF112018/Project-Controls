import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type GroupingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { ELEVATION } from '../../theme/tokens';
import { useResponsive } from '../../components/hooks/useResponsive';
import { HbcEmptyState } from '../../components/shared/HbcEmptyState';
import { SkeletonLoader } from '../../components/shared/SkeletonLoader';
import { useVirtualRows } from './useVirtualRows';
import { MemoizedTableRow } from './MemoizedTableRow';
import type { IHbcTanStackTableProps, IHbcTanStackTableColumn } from './types';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  tableWrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    boxShadow: ELEVATION.level1,
    overflowX: 'auto',
  },
  tableScrollContainer: {
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    ...shorthands.padding('8px', '12px'),
    textAlign: 'left',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    whiteSpace: 'nowrap',
    position: 'relative',
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  thGrouped: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  thSelect: {
    width: '44px',
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    fontSize: tokens.fontSizeBase300,
    borderBottom: `1px solid ${tokens.colorNeutralBackground3}`,
    color: tokens.colorNeutralForeground1,
  },
  tdGrouped: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  rowClickable: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  rowSelected: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  selectCell: {
    width: '44px',
    textAlign: 'center',
  },
  selectControl: {
    cursor: 'pointer',
  },
  sortArrow: {
    marginLeft: '4px',
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '6px',
    height: '100%',
    cursor: 'col-resize',
    touchAction: 'none',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  toolbarMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  paginationButtons: {
    display: 'flex',
    ...shorthands.gap('4px'),
  },
  pageBtn: {
    ...shorthands.padding('4px', '12px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  pageBtnDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  spacerCell: {
    ...shorthands.padding('0'),
    borderBottom: 'none',
    height: '0',
  },
});

const DEFAULT_PAGE_SIZE = 25;

function resolveSortValue<TData>(item: TData, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = item;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function mapColumns<TData>(columns: IHbcTanStackTableColumn<TData>[]): ColumnDef<TData>[] {
  return columns.map((column) => ({
    id: column.key,
    accessorFn: (item) => resolveSortValue(item, column.key),
    enableSorting: column.sortable ?? false,
    enableResizing: true,
    header: () => column.header,
    cell: ({ row }) => column.render(row.original),
  }));
}

function toRowSelectionMap(keys: Array<string | number>): RowSelectionState {
  return keys.reduce<RowSelectionState>((acc, key) => {
    acc[String(key)] = true;
    return acc;
  }, {});
}

function toSelectedKeys<TData>(
  rowSelection: RowSelectionState,
  rows: TData[],
  keyExtractor: (item: TData) => string | number
): Array<string | number> {
  return rows
    .map((item) => keyExtractor(item))
    .filter((key) => rowSelection[String(key)]);
}

function toVisibilityState(
  columns: IHbcTanStackTableColumn<unknown>[],
  visibility?: Record<string, boolean>
): VisibilityState {
  const defaults = columns.reduce<VisibilityState>((acc, column) => {
    acc[column.key] = true;
    return acc;
  }, {});

  return {
    ...defaults,
    ...(visibility ?? {}),
  };
}

export function HbcTanStackTable<TData>({
  columns,
  items,
  keyExtractor,
  isLoading,
  emptyTitle = 'No data',
  emptyDescription,
  onRowClick,
  sortField,
  sortAsc = true,
  onSort,
  pageSize = DEFAULT_PAGE_SIZE,
  ariaLabel = 'Data table',
  virtualization = { enabled: true, threshold: 200 },
  enableFiltering,
  globalFilter,
  onGlobalFilterChange,
  enableGrouping,
  groupBy,
  onGroupByChange,
  enableColumnVisibility,
  columnVisibility,
  onColumnVisibilityChange,
  enableRowSelection,
  selectedRowKeys,
  onSelectedRowKeysChange,
  enableColumnResize,
  columnSizing,
  onColumnSizingChange,
  pageIndex,
  onPageIndexChange,
  rowActions,
  disableRowMemoization,
}: IHbcTanStackTableProps<TData>): React.ReactElement {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  // React 18 concurrent features
  const [isPending, startTransition] = React.useTransition();
  const deferredGlobalFilter = React.useDeferredValue(globalFilter);

  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    sortField ? [{ id: sortField, desc: !sortAsc }] : []
  );
  const [internalPageIndex, setInternalPageIndex] = React.useState(0);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('');
  const [internalGrouping, setInternalGrouping] = React.useState<GroupingState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>(() =>
    toVisibilityState(columns as IHbcTanStackTableColumn<unknown>[], undefined)
  );
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [internalColumnSizing, setInternalColumnSizing] = React.useState<ColumnSizingState>({});

  const controlledSorting: SortingState = sortField ? [{ id: sortField, desc: !sortAsc }] : internalSorting;
  const resolvedPageIndex = pageIndex ?? internalPageIndex;
  const resolvedGlobalFilter = deferredGlobalFilter ?? internalGlobalFilter;
  const resolvedGrouping = groupBy ?? internalGrouping;
  const resolvedColumnVisibility: VisibilityState = columnVisibility
    ? toVisibilityState(columns as IHbcTanStackTableColumn<unknown>[], columnVisibility)
    : internalColumnVisibility;
  const resolvedRowSelection = selectedRowKeys ? toRowSelectionMap(selectedRowKeys) : internalRowSelection;
  const resolvedColumnSizing = columnSizing ?? internalColumnSizing;

  React.useEffect(() => {
    if (sortField) {
      setInternalSorting([{ id: sortField, desc: !sortAsc }]);
    }
  }, [sortField, sortAsc]);

  React.useEffect(() => {
    setInternalColumnVisibility((prev) => toVisibilityState(columns as IHbcTanStackTableColumn<unknown>[], prev));
  }, [columns]);

  const visibleColumns = React.useMemo(
    () => (isMobile ? columns.filter((column) => !column.hideOnMobile) : columns),
    [columns, isMobile]
  );

  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    const mapped = mapColumns(visibleColumns);

    if (enableRowSelection) {
      mapped.unshift({
        id: '__select',
        header: ({ table }) => (
          <input
            className={styles.selectControl}
            type="checkbox"
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            className={styles.selectControl}
            type="checkbox"
            aria-label="Select row"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        size: 44,
        enableSorting: false,
        enableResizing: false,
      });
    }

    if (rowActions) {
      mapped.push({
        id: '__actions',
        header: () => 'Actions',
        cell: ({ row }) => rowActions(row.original),
        enableSorting: false,
        enableResizing: false,
      });
    }

    return mapped;
  }, [enableRowSelection, rowActions, styles.selectControl, visibleColumns]);

  const table = useReactTable({
    data: items,
    columns: tableColumns,
    getRowId: (row) => String(keyExtractor(row)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting: controlledSorting,
      pagination: {
        pageIndex: resolvedPageIndex,
        pageSize,
      },
      globalFilter: enableFiltering ? resolvedGlobalFilter : undefined,
      grouping: enableGrouping ? resolvedGrouping : [],
      columnVisibility: enableColumnVisibility ? resolvedColumnVisibility : undefined,
      rowSelection: enableRowSelection ? resolvedRowSelection : undefined,
      columnSizing: resolvedColumnSizing,
    },
    onSortingChange: (updater) => {
      if (onSort) {
        return;
      }
      const next = typeof updater === 'function' ? updater(controlledSorting) : updater;
      startTransition(() => setInternalSorting(next));
    },
    onPaginationChange: (updater) => {
      const current: PaginationState = { pageIndex: resolvedPageIndex, pageSize };
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (pageIndex === undefined) {
        setInternalPageIndex(next.pageIndex);
      }
      onPageIndexChange?.(next.pageIndex);
    },
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedGlobalFilter) : updater;
      if (globalFilter === undefined) {
        setInternalGlobalFilter(String(next ?? ''));
      }
      onGlobalFilterChange?.(String(next ?? ''));
    },
    onGroupingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedGrouping) : updater;
      if (groupBy === undefined) {
        startTransition(() => setInternalGrouping(next));
      }
      onGroupByChange?.(next);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedColumnVisibility) : updater;
      if (columnVisibility === undefined) {
        setInternalColumnVisibility(next);
      }
      onColumnVisibilityChange?.(next as Record<string, boolean>);
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedRowSelection) : updater;
      if (selectedRowKeys === undefined) {
        setInternalRowSelection(next);
      }
      onSelectedRowKeysChange?.(toSelectedKeys(next, items, keyExtractor));
    },
    onColumnSizingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(resolvedColumnSizing) : updater;
      if (columnSizing === undefined) {
        setInternalColumnSizing(next);
      }
      onColumnSizingChange?.(next);
    },
    manualSorting: Boolean(onSort),
    enableRowSelection: Boolean(enableRowSelection),
    enableGrouping: Boolean(enableGrouping),
    enableColumnResizing: Boolean(enableColumnResize),
    columnResizeMode: 'onChange',
    globalFilterFn: 'includesString',
  });

  const rowModel = table.getRowModel();
  const totalPages = table.getPageCount();
  const paginationStart = items.length === 0 ? 0 : resolvedPageIndex * pageSize + 1;
  const paginationEnd = Math.min((resolvedPageIndex + 1) * pageSize, items.length);

  // Announce sort changes to screen readers
  const [sortAnnouncement, setSortAnnouncement] = React.useState('');
  const prevSortingRef = React.useRef(controlledSorting);
  React.useEffect(() => {
    const prev = prevSortingRef.current;
    prevSortingRef.current = controlledSorting;
    if (controlledSorting.length > 0 && JSON.stringify(prev) !== JSON.stringify(controlledSorting)) {
      const { id, desc } = controlledSorting[0];
      const col = columns.find(c => c.key === id);
      const label = col?.header ?? id;
      setSortAnnouncement(`Sorted by ${label}, ${desc ? 'descending' : 'ascending'}`);
    }
  }, [controlledSorting, columns]);

  const { isVirtualized, rowsToRender, paddingTop, paddingBottom } = useVirtualRows({
    rows: rowModel.rows,
    totalItemCount: rowModel.rows.length,
    scrollElementRef,
    virtualization,
  });

  if (isLoading) {
    return <SkeletonLoader variant="table" rows={5} columns={visibleColumns.length || 5} />;
  }

  if (items.length === 0) {
    return <HbcEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={styles.root} data-table-engine="tanstack" data-perf-table-rows={rowModel.rows.length} style={isPending ? { opacity: 0.8 } : undefined}>
      {/* Screen reader sort announcement */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {sortAnnouncement}
      </div>
      <div className={styles.tableWrapper}>
        <div
          ref={scrollElementRef}
          className={styles.tableScrollContainer}
          style={isVirtualized ? { maxHeight: virtualization.containerHeight ?? 560 } : undefined}
          data-virtualized={isVirtualized ? 'true' : 'false'}
        >
          <table className={styles.table} aria-label={ariaLabel}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const headerId = header.id;
                    const column = visibleColumns.find((item) => item.key === headerId);
                    const canSort = Boolean(column?.sortable);
                    const isSortActive = sortField === headerId || (sortField === undefined && header.column.getIsSorted());
                    const ariaSort = canSort && isSortActive
                      ? ((sortField ? sortAsc : header.column.getIsSorted() === 'asc') ? 'ascending' : 'descending')
                      : undefined;

                    const clickHandler = (): void => {
                      if (!canSort) {
                        return;
                      }
                      if (onSort) {
                        onSort(headerId);
                        return;
                      }
                      header.column.toggleSorting();
                    };

                    return (
                      <th
                        key={header.id}
                        className={mergeClasses(
                          styles.th,
                          headerId === '__select' ? styles.thSelect : undefined,
                          canSort ? styles.thSortable : undefined,
                          header.column.getIsGrouped() ? styles.thGrouped : undefined
                        )}
                        onClick={clickHandler}
                        aria-sort={ariaSort}
                        tabIndex={canSort ? 0 : undefined}
                        onKeyDown={canSort ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            clickHandler();
                          }
                        } : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && isSortActive && (
                          <span className={styles.sortArrow} aria-hidden="true">
                            {(sortField ? sortAsc : header.column.getIsSorted() === 'asc') ? '\u2191' : '\u2193'}
                          </span>
                        )}
                        {enableColumnResize && header.column.getCanResize() && (
                          <span
                            className={styles.resizeHandle}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            role="separator"
                            aria-orientation="vertical"
                            aria-label={`Resize ${String(header.column.columnDef.header)}`}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td className={styles.spacerCell} style={{ height: `${paddingTop}px` }} colSpan={table.getVisibleLeafColumns().length} />
                </tr>
              )}
              {rowsToRender.map((row) =>
                disableRowMemoization ? (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={mergeClasses(
                      onRowClick ? styles.rowClickable : undefined,
                      enableRowSelection && row.getIsSelected() ? styles.rowSelected : undefined
                    )}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row.original);
                      }
                    } : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={mergeClasses(
                          styles.td,
                          cell.column.id === '__select' ? styles.selectCell : undefined,
                          cell.getIsGrouped() ? styles.tdGrouped : undefined
                        )}
                      >
                        {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ) : (
                  <MemoizedTableRow
                    key={row.id}
                    row={row}
                    onRowClick={onRowClick}
                    enableRowSelection={enableRowSelection}
                    rowClickableClass={styles.rowClickable}
                    rowSelectedClass={styles.rowSelected}
                    tdClass={styles.td}
                    selectCellClass={styles.selectCell}
                    tdGroupedClass={styles.tdGrouped}
                  />
                )
              )}
              {paddingBottom > 0 && (
                <tr>
                  <td className={styles.spacerCell} style={{ height: `${paddingBottom}px` }} colSpan={table.getVisibleLeafColumns().length} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.toolbarMeta}>
        <span>{rowModel.rows.length} row(s)</span>
        {enableRowSelection && <span>{Object.keys(resolvedRowSelection).length} selected</span>}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <span>
            Showing {paginationStart}-{paginationEnd} of {items.length}
          </span>
          <div className={styles.paginationButtons}>
            <button
              type="button"
              disabled={resolvedPageIndex === 0}
              onClick={() => {
                const next = Math.max(0, resolvedPageIndex - 1);
                if (pageIndex === undefined) {
                  setInternalPageIndex(next);
                }
                onPageIndexChange?.(next);
              }}
              className={mergeClasses(styles.pageBtn, resolvedPageIndex === 0 ? styles.pageBtnDisabled : undefined)}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={resolvedPageIndex >= totalPages - 1}
              onClick={() => {
                const next = Math.min(totalPages - 1, resolvedPageIndex + 1);
                if (pageIndex === undefined) {
                  setInternalPageIndex(next);
                }
                onPageIndexChange?.(next);
              }}
              className={mergeClasses(styles.pageBtn, resolvedPageIndex >= totalPages - 1 ? styles.pageBtnDisabled : undefined)}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
