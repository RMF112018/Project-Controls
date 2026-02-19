import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Row } from '@tanstack/react-table';
import type { IHbcVirtualizationConfig } from './types';

interface IUseVirtualRowsParams<TData> {
  rows: Row<TData>[];
  totalItemCount: number;
  scrollElementRef: React.RefObject<HTMLDivElement>;
  virtualization?: IHbcVirtualizationConfig;
}

interface IUseVirtualRowsResult<TData> {
  isVirtualized: boolean;
  rowsToRender: Row<TData>[];
  paddingTop: number;
  paddingBottom: number;
}

const DEFAULT_VIRTUALIZATION: Required<IHbcVirtualizationConfig> = {
  enabled: true,
  threshold: 200,
  estimateRowHeight: 44,
  containerHeight: 560,
  overscan: 8,
};

export function useVirtualRows<TData>({
  rows,
  totalItemCount,
  scrollElementRef,
  virtualization,
}: IUseVirtualRowsParams<TData>): IUseVirtualRowsResult<TData> {
  const config = React.useMemo(
    () => ({ ...DEFAULT_VIRTUALIZATION, ...virtualization }),
    [virtualization]
  );

  const isVirtualized = config.enabled && totalItemCount >= config.threshold;

  const virtualizer = useVirtualizer({
    count: isVirtualized ? rows.length : 0,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => config.estimateRowHeight,
    overscan: config.overscan,
    initialRect: { height: config.containerHeight, width: 1000 },
  });

  if (!isVirtualized) {
    return {
      isVirtualized: false,
      rowsToRender: rows,
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  const virtualItems = virtualizer.getVirtualItems();
  const rowsToRender = virtualItems.map((item) => rows[item.index]).filter(Boolean);

  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const lastItem = virtualItems[virtualItems.length - 1];
  const paddingBottom = lastItem
    ? Math.max(0, virtualizer.getTotalSize() - lastItem.end)
    : 0;

  return {
    isVirtualized: true,
    rowsToRender,
    paddingTop,
    paddingBottom,
  };
}
