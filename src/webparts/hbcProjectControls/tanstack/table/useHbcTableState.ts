import * as React from 'react';
import type { SortingState } from '@tanstack/react-table';
import type { IHbcTableState } from './types';

export function useHbcTableState(itemCount: number, sortField?: string, sortAsc = true): IHbcTableState {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [sorting, setSorting] = React.useState<SortingState>(() =>
    sortField ? [{ id: sortField, desc: !sortAsc }] : []
  );

  React.useEffect(() => {
    setCurrentPage(0);
  }, [itemCount]);

  React.useEffect(() => {
    if (sortField) {
      setSorting([{ id: sortField, desc: !sortAsc }]);
    }
  }, [sortField, sortAsc]);

  return {
    currentPage,
    setCurrentPage,
    sorting,
    setSorting,
  };
}
