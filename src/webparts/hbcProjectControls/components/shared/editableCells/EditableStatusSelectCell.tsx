import * as React from 'react';
import { Select, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { IEditCellProps } from './types';
import type { KickoffDeliverableStatus } from '@hbc/sp-services';

export interface IStatusSelectCellProps extends IEditCellProps {
  value: KickoffDeliverableStatus;
  options: string[];
  disabled?: boolean;
  cellClassName?: string;
  inputClassName?: string;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  Pending: { bg: '#FFF3CD', fg: '#856404' },
  'In Progress': { bg: '#CCE5FF', fg: '#004085' },
  Complete: { bg: '#D4EDDA', fg: '#155724' },
};

const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  disabled: {
    color: tokens.colorNeutralForegroundDisabled,
    fontStyle: 'italic',
  },
});

export const EditableStatusSelectCell: React.FC<IStatusSelectCellProps> = React.memo(({
  rowId, field, value, options, disabled, onSave, cellClassName, inputClassName,
}) => {
  const styles = useStyles();
  const [editing, setEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => setLocalValue(value), [value]);

  if (disabled) {
    return <span className={styles.disabled}>{'\u2014'}</span>;
  }

  if (!editing) {
    const colors = localValue ? STATUS_COLORS[localValue] : undefined;
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${localValue || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {localValue && colors ? (
          <span className={styles.badge} style={{ backgroundColor: colors.bg, color: colors.fg }}>
            {localValue}
          </span>
        ) : (
          '\u2014'
        )}
      </span>
    );
  }

  return (
    <Select
      className={inputClassName}
      size="small"
      defaultValue={localValue ?? ''}
      autoFocus
      aria-label={field}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const newVal = (e.target.value || null) as KickoffDeliverableStatus;
        if (newVal !== localValue) {
          setLocalValue(newVal);
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
EditableStatusSelectCell.displayName = 'EditableStatusSelectCell';
