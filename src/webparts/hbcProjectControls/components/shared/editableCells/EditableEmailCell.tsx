import * as React from 'react';
import { Input, makeStyles, tokens } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface IEmailCellProps extends IEditCellProps {
  value: string;
  placeholder?: string;
  cellClassName?: string;
  inputClassName?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const useStyles = makeStyles({
  invalid: {
    color: tokens.colorPaletteRedForeground1,
  },
});

export const EditableEmailCell: React.FC<IEmailCellProps> = React.memo(({
  rowId, field, value, placeholder, onSave, cellClassName, inputClassName,
}) => {
  const styles = useStyles();
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const [showInvalid, setShowInvalid] = React.useState(false);
  const cancelledRef = React.useRef(false);

  React.useEffect(() => setLocalValue(value), [value]);
  React.useEffect(() => {
    if (showInvalid) {
      const t = setTimeout(() => setShowInvalid(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showInvalid]);

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
        {showInvalid ? (
          <span className={styles.invalid}>Invalid email</span>
        ) : (
          localValue || '\u2014'
        )}
      </span>
    );
  }

  return (
    <Input
      className={inputClassName}
      appearance="underline"
      size="small"
      type="email"
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
        const newVal = e.target.value.trim();
        if (!newVal) {
          // Allow clearing
          if (localValue) {
            setLocalValue('');
            onSave(rowId, field, '');
          }
          setEditing(false);
          return;
        }
        if (!EMAIL_REGEX.test(newVal)) {
          // Invalid — revert and show indicator
          setShowInvalid(true);
          setEditing(false);
          return;
        }
        if (newVal !== localValue) {
          setLocalValue(newVal);
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
EditableEmailCell.displayName = 'EditableEmailCell';
