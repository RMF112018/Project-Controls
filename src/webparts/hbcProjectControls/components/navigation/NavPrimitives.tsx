import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { HBC_COLORS, TRANSITION } from '../../theme/tokens';

const useStyles = makeStyles({
  group: {
    ...shorthands.padding('4px', '0'),
  },
  groupLabel: {
    ...shorthands.padding('8px', '16px', '4px'),
    fontSize: '10px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('7px', '16px'),
    fontSize: '13px',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: TRANSITION.fast,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    borderLeft: '3px solid transparent',
    color: tokens.colorNeutralForeground2,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  itemActive: {
    fontWeight: 600,
    color: HBC_COLORS.navy,
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeftColor: HBC_COLORS.orange,
  },
});

interface INavGroupProps {
  label: string;
  children: React.ReactNode;
}

export const NavGroup: React.FC<INavGroupProps> = ({ label, children }) => {
  const styles = useStyles();
  return (
    <div className={styles.group}>
      <div className={styles.groupLabel}>{label}</div>
      {children}
    </div>
  );
};

interface INavItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export const NavItem: React.FC<INavItemProps> = ({ label, active, onClick }) => {
  const styles = useStyles();
  return (
    <div
      role="link"
      tabIndex={0}
      className={mergeClasses(styles.item, active && styles.itemActive)}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    >
      {label}
    </div>
  );
};
