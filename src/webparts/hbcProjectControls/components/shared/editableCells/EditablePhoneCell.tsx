import * as React from 'react';
import { Input } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface IPhoneCellProps extends IEditCellProps {
  value: string;
  placeholder?: string;
  cellClassName?: string;
  inputClassName?: string;
}

/** Auto-format 10 digits to XXX-XXX-XXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export const EditablePhoneCell: React.FC<IPhoneCellProps> = React.memo(({
  rowId, field, value, placeholder, onSave, cellClassName, inputClassName,
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
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="tel"
      placeholder={placeholder}
      defaultValue={localValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const formatted = formatPhone(e.target.value);
        if (formatted !== localValue) {
          setLocalValue(formatted);
          onSave(rowId, field, formatted);
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
EditablePhoneCell.displayName = 'EditablePhoneCell';
