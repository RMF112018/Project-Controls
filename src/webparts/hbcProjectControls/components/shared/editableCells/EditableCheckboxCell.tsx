import * as React from 'react';
import { Checkbox } from '@fluentui/react-components';
import type { IEditCellProps } from './types';

export interface ICheckboxCellProps extends IEditCellProps {
  checked: boolean;
  wrapperClassName?: string;
}

export const EditableCheckboxCell: React.FC<ICheckboxCellProps> = React.memo(({
  rowId, field, checked: initialChecked, onSave, wrapperClassName,
}) => {
  const [checked, setChecked] = React.useState(initialChecked);
  React.useEffect(() => setChecked(initialChecked), [initialChecked]);
  return (
    <div className={wrapperClassName} onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={checked}
        aria-label={field}
        onChange={(_, d) => {
          const next = Boolean(d.checked);
          setChecked(next);
          onSave(rowId, field, next);
        }}
      />
    </div>
  );
});
EditableCheckboxCell.displayName = 'EditableCheckboxCell';
