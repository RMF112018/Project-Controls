import * as React from 'react';
import { Select } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface ISelectCellProps extends IEditCellProps {
  value: string;
  options: string[];
  cellClassName?: string;
  inputClassName?: string;
}

export const EditableSelectCell: React.FC<ISelectCellProps> = React.memo(({
  rowId, field, value, options, onSave, cellClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
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
    <Select
      className={inputClassName}
      size="small"
      defaultValue={localValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const newVal = e.target.value || undefined;
        if (newVal !== localValue) {
          setLocalValue(newVal ?? '');
          onSave(rowId, field, newVal);
        }
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    >
      <option value="">{'\u2014'}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </Select>
  );
});
EditableSelectCell.displayName = 'EditableSelectCell';
