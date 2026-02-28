import * as React from 'react';
import { Input, mergeClasses } from '@fluentui/react-components';
import { formatCurrency } from '@hbc/sp-services';
import type { IEditCellProps } from './types';

export interface INumberCellProps extends IEditCellProps {
  numValue: number | undefined | null;
  isCurrency?: boolean;
  cellClassName?: string;
  currencyClassName?: string;
  inputClassName?: string;
}

export const EditableNumberCell: React.FC<INumberCellProps> = React.memo(({
  rowId, field, numValue, isCurrency, onSave, cellClassName, currencyClassName, inputClassName,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [localNum, setLocalNum] = React.useState(numValue);
  const cancelledRef = React.useRef(false);
  React.useEffect(() => setLocalNum(numValue), [numValue]);
  const display = isCurrency ? formatCurrency(localNum, { placeholder: '\u2014', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : (localNum != null ? String(localNum) : '\u2014');
  if (!editing) {
    return (
      <span
        className={mergeClasses(cellClassName, isCurrency ? currencyClassName : undefined)}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${display}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {display}
      </span>
    );
  }
  const strValue = localNum != null ? String(localNum) : '';
  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="number"
      defaultValue={strValue}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const newVal = e.target.value ? Number(e.target.value) : undefined;
        if (newVal !== localNum) {
          setLocalNum(newVal);
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
EditableNumberCell.displayName = 'EditableNumberCell';
