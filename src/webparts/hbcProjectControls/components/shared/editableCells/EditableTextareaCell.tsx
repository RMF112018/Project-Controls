import * as React from 'react';
import { Textarea } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface ITextareaCellProps extends IEditCellProps {
  value: string;
  cellClassName?: string;
  inputClassName?: string;
}

export const EditableTextareaCell: React.FC<ITextareaCellProps> = React.memo(({
  rowId, field, value, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const cancelledRef = React.useRef(false);

  React.useEffect(() => setLocalValue(value), [value]);

  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${localValue || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {localValue || '\u2014'}
      </span>
    );
  }

  return (
    <Textarea
      className={inputClassName}
      appearance="outline"
      size="small"
      resize="vertical"
      rows={3}
      defaultValue={localValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value;
        if (newVal !== localValue) {
          setLocalValue(newVal);
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onKeyDown={(e) => {
        // Shift+Enter for newline, plain Escape to cancel
        if (e.key === 'Escape') {
          cancelledRef.current = true;
          setEditing(false);
        }
      }}
    />
  );
});
EditableTextareaCell.displayName = 'EditableTextareaCell';
