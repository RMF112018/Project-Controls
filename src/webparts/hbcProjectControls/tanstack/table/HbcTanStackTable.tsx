import * as React from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { ELEVATION } from '../../theme/tokens';
import { useResponsive } from '../../components/hooks/useResponsive';
import { EmptyState } from '../../components/shared/EmptyState';
import { SkeletonLoader } from '../../components/shared/SkeletonLoader';
import { useHbcTableState } from './useHbcTableState';
import { useVirtualRows } from './useVirtualRows';
import type { IHbcTanStackTableProps, IHbcTanStackTableColumn } from './types';

const useStyles = makeStyles({
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
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    whiteSpace: 'nowrap',
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    fontSize: '13px',
    borderBottom: `1px solid ${tokens.colorNeutralBackground3}`,
    color: tokens.colorNeutralForeground1,
  },
  rowClickable: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  sortArrow: {
    marginLeft: '4px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
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
    fontSize: '13px',
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
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function mapColumns<TData>(columns: IHbcTanStackTableColumn<TData>[]): ColumnDef<TData>[] {
  return columns.map((column) => ({
    id: column.key,
    accessorFn: (item) => resolveSortValue(item, column.key),
    enableSorting: column.sortable ?? false,
    header: column.header,
    cell: ({ row }) => column.render(row.original),
    meta: {
      width: column.width,
      minWidth: column.minWidth,
    },
  }));
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
}: IHbcTanStackTableProps<TData>): React.ReactElement {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const scrollElementRef = React.useRef<HTMLDivElement>(null);
  const { currentPage, setCurrentPage, sorting, setSorting } = useHbcTableState(items.length, sortField, sortAsc);

  const visibleColumns = React.useMemo(
    () => (isMobile ? columns.filter((c) => !c.hideOnMobile) : columns),
    [columns, isMobile]
  );

  const table = useReactTable({
    data: items,
    columns: mapColumns(visibleColumns),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex: currentPage, pageSize })
        : updater;
      setCurrentPage(next.pageIndex);
    },
    manualSorting: Boolean(onSort),
  });

  const rowModel = table.getRowModel();
  const totalPages = table.getPageCount();
  const paginationStart = items.length === 0 ? 0 : currentPage * pageSize + 1;
  const paginationEnd = Math.min((currentPage + 1) * pageSize, items.length);

  const {
    isVirtualized,
    rowsToRender,
    paddingTop,
    paddingBottom,
  } = useVirtualRows({
    rows: rowModel.rows,
    totalItemCount: items.length,
    scrollElementRef,
    virtualization,
  });

  if (isLoading) {
    return <SkeletonLoader variant="table" rows={5} columns={visibleColumns.length || 5} />;
  }

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div data-table-engine="tanstack">
      <div className={styles.tableWrapper}>
        <div
          ref={scrollElementRef}
          className={styles.tableScrollContainer}
          style={isVirtualized ? { maxHeight: virtualization.containerHeight ?? 560 } : undefined}
          data-virtualized={isVirtualized ? 'true' : 'false'}
        >
          <table className={styles.table} aria-label={ariaLabel}>
            <thead>
              <tr>
                {table.getHeaderGroups()[0].headers.map((header) => {
                  const column = visibleColumns.find((c) => c.key === header.id);
                  const canSort = Boolean(column?.sortable);
                  const isSortActive = sortField === header.id;
                  const ariaSort = canSort && isSortActive
                    ? (sortAsc ? 'ascending' : 'descending')
                    : undefined;

                  const clickHandler = (): void => {
                    if (!canSort) return;
                    if (onSort) {
                      onSort(header.id);
                    } else {
                      header.column.toggleSorting();
                    }
                  };

                  return (
                    <th
                      key={header.id}
                      className={mergeClasses(styles.th, canSort ? styles.thSortable : undefined)}
                      style={{ width: column?.width, minWidth: column?.minWidth }}
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
                      {header.isPlaceholder ? null : String(header.column.columnDef.header)}
                      {canSort && isSortActive && (
                        <span className={styles.sortArrow} aria-hidden="true">
                          {sortAsc ? '\u2191' : '\u2193'}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && (
                <tr>
                  <td className={styles.spacerCell} style={{ height: `${paddingTop}px` }} colSpan={visibleColumns.length} />
                </tr>
              )}
              {rowsToRender.map((row) => (
                <tr
                  key={keyExtractor(row.original)}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? styles.rowClickable : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  } : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.td}>
                      {cell.renderValue() as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
              {paddingBottom > 0 && (
                <tr>
                  <td className={styles.spacerCell} style={{ height: `${paddingBottom}px` }} colSpan={visibleColumns.length} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <span>
            Showing {paginationStart}-{paginationEnd} of {items.length}
          </span>
          <div className={styles.paginationButtons}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className={mergeClasses(styles.pageBtn, currentPage === 0 ? styles.pageBtnDisabled : undefined)}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className={mergeClasses(styles.pageBtn, currentPage >= totalPages - 1 ? styles.pageBtnDisabled : undefined)}
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
