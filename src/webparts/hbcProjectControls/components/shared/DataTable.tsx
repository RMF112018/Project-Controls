import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';
import { useResponsive } from '../hooks/useResponsive';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export interface IDataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
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
}: IDataTableProps<T>): React.ReactElement {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = React.useState(0);

  // Filter out columns hidden on mobile
  const visibleColumns = React.useMemo(
    () => isMobile ? columns.filter(c => !c.hideOnMobile) : columns,
    [columns, isMobile]
  );

  const totalPages = Math.ceil(items.length / pageSize);
  const pagedItems = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // Reset to first page when items change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [items.length]);

  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: HBC_COLORS.gray500,
    borderBottom: `2px solid ${HBC_COLORS.gray200}`,
    whiteSpace: 'nowrap',
  };
  const cellStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
    color: HBC_COLORS.gray800,
  };

  if (isLoading) return <LoadingSpinner label="Loading..." />;

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  style={{
                    ...headerStyle,
                    cursor: col.sortable && onSort ? 'pointer' : 'default',
                    userSelect: col.sortable ? 'none' : undefined,
                    width: col.width,
                  }}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  {col.header}
                  {col.sortable && sortField === col.key && (
                    <span style={{ marginLeft: '4px' }}>{sortAsc ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedItems.map(item => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick && onRowClick(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onMouseEnter={e => onRowClick && ((e.currentTarget as HTMLElement).style.backgroundColor = HBC_COLORS.gray50)}
                onMouseLeave={e => onRowClick && ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
              >
                {visibleColumns.map(col => (
                  <td key={col.key} style={cellStyle}>{col.render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          fontSize: '13px',
          color: HBC_COLORS.gray500,
        }}>
          <span>
            Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, items.length)} of {items.length}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{
                padding: '4px 12px',
                border: `1px solid ${HBC_COLORS.gray200}`,
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 0 ? 0.5 : 1,
                fontSize: '13px',
              }}
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{
                padding: '4px 12px',
                border: `1px solid ${HBC_COLORS.gray200}`,
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                fontSize: '13px',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
