import * as React from 'react';
import { Field, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';

export type HbcFieldOrientation = 'vertical' | 'horizontal';

export interface IHbcFieldProps {
  label: string;
  hint?: string;
  validationMessage?: string;
  required?: boolean;
  orientation?: HbcFieldOrientation;
  children: React.ReactElement;
  className?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  horizontal: {
    gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
    alignItems: 'start',
  },
  vertical: {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
  field: {
    color: tokens.colorNeutralForeground1,
  },
});

export const HbcField: React.FC<IHbcFieldProps> = ({
  label,
  hint,
  validationMessage,
  required = false,
  orientation = 'vertical',
  children,
  className,
}) => {
  const styles = useStyles();

  return (
    <div className={mergeClasses(styles.root, orientation === 'horizontal' ? styles.horizontal : styles.vertical, className)}>
      <Field
        className={styles.field}
        label={label}
        hint={hint}
        validationMessage={validationMessage}
        required={required}
      >
        {children}
      </Field>
    </div>
  );
};

export default HbcField;
