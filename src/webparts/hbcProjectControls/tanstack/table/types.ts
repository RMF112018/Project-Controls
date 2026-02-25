import type * as React from 'react';

export interface IHbcTanStackTableColumn<TData> {
  key: string;
  header: string;
  render: (item: TData) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  hideOnMobile?: boolean;
}

export interface IHbcVirtualizationConfig {
  enabled: boolean;
  threshold: number;
  estimateRowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  /** When true, overscan is automatically reduced for large datasets (>500 rows) to improve scroll perf. */
  adaptiveOverscan?: boolean;
}

export interface IHbcTanStackTableProps<TData> {
  columns: IHbcTanStackTableColumn<TData>[];
  items: TData[];
  keyExtractor: (item: TData) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: TData) => void;
  sortField?: string;
  sortAsc?: boolean;
  onSort?: (field: string) => void;
  pageSize?: number;
  ariaLabel?: string;
  virtualization?: IHbcVirtualizationConfig;

  enableFiltering?: boolean;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;

  enableGrouping?: boolean;
  groupBy?: string[];
  onGroupByChange?: (groupBy: string[]) => void;

  enableColumnVisibility?: boolean;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  enableRowSelection?: boolean;
  selectedRowKeys?: Array<string | number>;
  onSelectedRowKeysChange?: (keys: Array<string | number>) => void;

  enableColumnResize?: boolean;
  columnSizing?: Record<string, number>;
  onColumnSizingChange?: (sizes: Record<string, number>) => void;

  pageIndex?: number;
  onPageIndexChange?: (pageIndex: number) => void;

  rowActions?: (item: TData) => React.ReactNode;

  /** When true, disables React.memo on table rows. Useful for rows with external mutable state. */
  disableRowMemoization?: boolean;
}

export interface IHbcTableState {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sorting: Array<{ id: string; desc: boolean }>;
  setSorting: React.Dispatch<React.SetStateAction<Array<{ id: string; desc: boolean }>>>;
}
