import * as React from 'react';
import { Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import type { EstimatingKickoffStatus } from '@hbc/sp-services';
import type { IEditCellProps } from './types';

const useStyles = makeStyles({
  group: {
    display: 'inline-flex',
    ...shorthands.gap('2px'),
  },
  btn: {
    minWidth: '28px',
    height: '24px',
    ...shorthands.padding('0', '4px'),
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  yes: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  no: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  na: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  inactive: {
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground4,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
});

export interface IYesNoNaCellProps extends IEditCellProps {
  value: EstimatingKickoffStatus;
}

export const EditableYesNoNaCell: React.FC<IYesNoNaCellProps> = React.memo(({
  rowId, field, value, onSave,
}) => {
  const styles = useStyles();

  const handleClick = React.useCallback((status: EstimatingKickoffStatus) => {
    // Toggle: clicking active status clears it, clicking different sets it
    const next = value === status ? null : status;
    onSave(rowId, field, next);
  }, [rowId, field, value, onSave]);

  return (
    <div className={styles.group} onClick={(e) => e.stopPropagation()}>
      <Button
        className={mergeClasses(styles.btn, value === 'yes' ? styles.yes : styles.inactive)}
        appearance="subtle"
        size="small"
        aria-label={`${field}: YES`}
        aria-pressed={value === 'yes'}
        onClick={() => handleClick('yes')}
      >
        Y
      </Button>
      <Button
        className={mergeClasses(styles.btn, value === 'no' ? styles.no : styles.inactive)}
        appearance="subtle"
        size="small"
        aria-label={`${field}: NO`}
        aria-pressed={value === 'no'}
        onClick={() => handleClick('no')}
      >
        N
      </Button>
      <Button
        className={mergeClasses(styles.btn, value === 'na' ? styles.na : styles.inactive)}
        appearance="subtle"
        size="small"
        aria-label={`${field}: N/A`}
        aria-pressed={value === 'na'}
        onClick={() => handleClick('na')}
      >
        N/A
      </Button>
    </div>
  );
});
EditableYesNoNaCell.displayName = 'EditableYesNoNaCell';
