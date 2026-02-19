import type * as React from 'react';
import type { IHbcTanStackTableColumn } from '../types';

export interface ILegacyDataTableColumn<TData> {
  key: string;
  header: string;
  render: (item: TData) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  hideOnMobile?: boolean;
}

export function toTanStackColumns<TData>(
  legacyColumns: readonly ILegacyDataTableColumn<TData>[]
): IHbcTanStackTableColumn<TData>[] {
  return legacyColumns.map((column) => ({
    key: column.key,
    header: column.header,
    render: column.render,
    sortable: column.sortable,
    width: column.width,
    minWidth: column.minWidth,
    hideOnMobile: column.hideOnMobile,
  }));
}
