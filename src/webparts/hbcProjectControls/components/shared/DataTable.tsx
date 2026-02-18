import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { ELEVATION } from '../../theme/tokens';
import { useResponsive } from '../hooks/useResponsive';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

const useStyles = makeStyles({
  tableWrapper: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    boxShadow: ELEVATION.level1,
    overflowX: 'auto',
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
});

export interface IDataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  hideOnMobile?: boolean;
}

interface IDataTableProps<T> {
  columns: IDataTableColumn<T>[];
  items: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  sortField?: string;
  sortAsc?: boolean;
  onSort?: (field: string) => void;
  pageSize?: number;
  /** Accessible label for the table (required for WCAG 1.3.1 / 2.4.6) */
  ariaLabel?: string;
}

export function DataTable<T>({
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
  pageSize = 25,
  ariaLabel = 'Data table',
}: IDataTableProps<T>): React.ReactElement {
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = React.useState(0);

  const visibleColumns = React.useMemo(
    () => isMobile ? columns.filter(c => !c.hideOnMobile) : columns,
    [columns, isMobile]
  );

  const totalPages = Math.ceil(items.length / pageSize);
  const pagedItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [items.length]);

  if (isLoading) return <SkeletonLoader variant="table" rows={5} columns={visibleColumns.length || 5} />;

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label={ariaLabel}>
          <thead>
            <tr>
              {visibleColumns.map(col => {
                const isSortActive = col.sortable && onSort;
                const ariaSort = isSortActive && sortField === col.key
                  ? (sortAsc ? 'ascending' : 'descending')
                  : undefined;
                return (
                  <th
                    key={col.key}
                    className={mergeClasses(styles.th, isSortActive ? styles.thSortable : undefined)}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    onClick={() => isSortActive && onSort(col.key)}
                    aria-sort={ariaSort}
                    tabIndex={isSortActive ? 0 : undefined}
                    onKeyDown={isSortActive ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSort(col.key);
                      }
                    } : undefined}
                  >
                    {col.header}
                    {col.sortable && sortField === col.key && (
                      <span className={styles.sortArrow} aria-hidden="true">{sortAsc ? '\u2191' : '\u2193'}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedItems.map(item => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? styles.rowClickable : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(item);
                  }
                } : undefined}
              >
                {visibleColumns.map(col => (
                  <td key={col.key} className={styles.td}>{col.render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <span>
            Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, items.length)} of {items.length}
          </span>
          <div className={styles.paginationButtons}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className={mergeClasses(styles.pageBtn, currentPage === 0 ? styles.pageBtnDisabled : undefined)}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
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
