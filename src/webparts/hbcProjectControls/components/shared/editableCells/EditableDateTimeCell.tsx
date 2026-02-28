import * as React from 'react';
import { Input, makeStyles, shorthands } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface IDateTimeCellProps extends IEditCellProps {
  isoValue: string | undefined | null;
  cellClassName?: string;
  inputClassName?: string;
}

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '4px',
  },
  dateInput: {
    flex: '1 1 auto',
    minWidth: '110px',
  },
  timeInput: {
    flex: '0 0 auto',
    width: '100px',
  },
});

/** Format ISO string to "MM/DD/YYYY at h:mm AM/PM" */
function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${mm}/${dd}/${yyyy} at ${hours}:${minutes} ${ampm}`;
}

/** Extract date portion (YYYY-MM-DD) from ISO */
function toDateStr(iso: string | undefined | null): string {
  if (!iso) return '';
  return iso.split('T')[0] || '';
}

/** Extract time portion (HH:mm) from ISO */
function toTimeStr(iso: string | undefined | null): string {
  if (!iso) return '';
  const timePart = iso.split('T')[1];
  if (!timePart) return '';
  return timePart.substring(0, 5);
}

export const EditableDateTimeCell: React.FC<IDateTimeCellProps> = React.memo(({
  rowId, field, isoValue, onSave, cellClassName, inputClassName,
}) => {
  const styles = useStyles();
  const [editing, setEditing] = React.useState(false);
  const [localIso, setLocalIso] = React.useState(isoValue);
  const cancelledRef = React.useRef(false);
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => setLocalIso(isoValue), [isoValue]);

  const displayStr = formatDateTime(localIso);

  if (!editing) {
    return (
      <span
        className={cellClassName}
        role="button"
        tabIndex={0}
        aria-label={`${field}: ${displayStr || 'empty'}. Press Enter to edit.`}
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); setEditing(true); } }}
      >
        {displayStr || '\u2014'}
      </span>
    );
  }

  const handleBlur = (): void => {
    // Delay to allow focus to shift between date/time inputs
    blurTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) {
        cancelledRef.current = false;
        return;
      }
      setEditing(false);
    }, 150);
  };

  const handleFocus = (): void => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleChange = (dateVal: string, timeVal: string): void => {
    if (!dateVal) {
      if (localIso) {
        setLocalIso(undefined);
        onSave(rowId, field, undefined);
      }
      return;
    }
    const combined = timeVal ? `${dateVal}T${timeVal}:00` : `${dateVal}T00:00:00`;
    if (combined !== localIso) {
      setLocalIso(combined);
      onSave(rowId, field, combined);
    }
  };

  const dateVal = toDateStr(localIso);
  const timeVal = toTimeStr(localIso);

  return (
    <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
      <Input
        className={styles.dateInput}
        appearance="underline"
        size="small"
        type="date"
        defaultValue={dateVal}
        autoFocus
        aria-label={`${field} date`}
        onFocus={handleFocus}
        onBlur={(e) => {
          const newDate = e.target.value;
          handleChange(newDate, timeVal);
          handleBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { cancelledRef.current = true; setEditing(false); }
        }}
      />
      <Input
        className={styles.timeInput}
        appearance="underline"
        size="small"
        type="time"
        defaultValue={timeVal}
        aria-label={`${field} time`}
        onFocus={handleFocus}
        onBlur={(e) => {
          const newTime = e.target.value;
          handleChange(dateVal, newTime);
          handleBlur();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { cancelledRef.current = true; setEditing(false); }
        }}
      />
    </div>
  );
});
EditableDateTimeCell.displayName = 'EditableDateTimeCell';
