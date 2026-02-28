import * as React from 'react';
import { Input } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface IDateCellProps extends IEditCellProps {
  isoValue: string | undefined | null;
  cellClassName?: string;
  inputClassName?: string;
}

export const EditableDateCell: React.FC<IDateCellProps> = React.memo(({
  rowId, field, isoValue, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localIso, setLocalIso] = React.useState(isoValue);
  const cancelledRef = React.useRef(false);
  React.useEffect(() => setLocalIso(isoValue), [isoValue]);
  const dateStr = localIso ? localIso.split('T')[0] : '';
  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${dateStr || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {dateStr || '\u2014'}
      </span>
    );
  }
  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="date"
      defaultValue={dateStr}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value || undefined;
        if (newVal !== localIso) {
          setLocalIso(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          cancelledRef.current = true;
          setEditing(false);
        }
      }}
    />
  );
});
EditableDateCell.displayName = 'EditableDateCell';
