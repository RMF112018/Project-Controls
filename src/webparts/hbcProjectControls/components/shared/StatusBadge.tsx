import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';

const useStyles = makeStyles({
  badgeSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  badgeMedium: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
});

interface IStatusBadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<IStatusBadgeProps> = ({ label, color, backgroundColor, size = 'small' }) => {
  const styles = useStyles();
  return (
    <span
      className={size === 'small' ? styles.badgeSmall : styles.badgeMedium}
      style={{ color, backgroundColor }}
    >
      {label}
    </span>
  );
};
