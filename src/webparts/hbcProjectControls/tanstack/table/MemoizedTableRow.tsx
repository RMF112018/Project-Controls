import * as React from 'react';
import { flexRender, type Row } from '@tanstack/react-table';
import { mergeClasses } from '@fluentui/react-components';

interface IMemoizedTableRowProps<TData> {
  row: Row<TData>;
  onRowClick?: (item: TData) => void;
  enableRowSelection?: boolean;
  rowClickableClass?: string;
  rowSelectedClass?: string;
  tdClass: string;
  selectCellClass?: string;
  tdGroupedClass?: string;
}

function MemoizedTableRowInner<TData>({
  row,
  onRowClick,
  enableRowSelection,
  rowClickableClass,
  rowSelectedClass,
  tdClass,
  selectCellClass,
  tdGroupedClass,
}: IMemoizedTableRowProps<TData>): React.ReactElement {
  return (
    <tr
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={mergeClasses(
        onRowClick ? rowClickableClass : undefined,
        enableRowSelection && row.getIsSelected() ? rowSelectedClass : undefined
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
            tdClass,
            cell.column.id === '__select' ? selectCellClass : undefined,
            cell.getIsGrouped() ? tdGroupedClass : undefined
          )}
        >
          {cell.getIsPlaceholder() ? null : flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

function areRowPropsEqual<TData>(
  prev: IMemoizedTableRowProps<TData>,
  next: IMemoizedTableRowProps<TData>
): boolean {
  // Fast bail-out: different row identity
  if (prev.row.id !== next.row.id) return false;
  // Selection state changed
  if (prev.enableRowSelection && prev.row.getIsSelected() !== next.row.getIsSelected()) return false;
  // Data reference changed (triggers cell re-render)
  if (prev.row.original !== next.row.original) return false;
  // Callback identity changed
  if (prev.onRowClick !== next.onRowClick) return false;
  // Class references changed
  if (prev.rowClickableClass !== next.rowClickableClass) return false;
  if (prev.rowSelectedClass !== next.rowSelectedClass) return false;
  if (prev.tdClass !== next.tdClass) return false;
  return true;
}

// React.memo with custom equality — generic component requires cast
export const MemoizedTableRow = React.memo(
  MemoizedTableRowInner,
  areRowPropsEqual
) as typeof MemoizedTableRowInner;
