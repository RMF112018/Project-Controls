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
}

export interface IHbcTableState {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sorting: Array<{ id: string; desc: boolean }>;
  setSorting: React.Dispatch<React.SetStateAction<Array<{ id: string; desc: boolean }>>>;
}
