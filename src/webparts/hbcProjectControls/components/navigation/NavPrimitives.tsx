/**
 * NavPrimitives.tsx — Extracted navigation building blocks.
 * Used by both ContextualSidebar (new) and NavigationSidebar (legacy fallback).
 *
 * All callbacks must be stable (useCallback with empty or stable deps)
 * to prevent re-render cascades per CLAUDE.md §4.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { HBC_COLORS, TRANSITION } from '../../theme/tokens';

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  navItem: {
    fontSize: '13px',
    transitionProperty: 'all',
    transitionDuration: TRANSITION.fast,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
  },
  navItemActive: {
    fontWeight: '600',
    color: HBC_COLORS.navy,
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeft: `3px solid ${HBC_COLORS.orange}`,
  },
  navItemInactive: {
    fontWeight: '400',
    color: tokens.colorNeutralForeground2,
    borderLeft: '3px solid transparent',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  navItemDisabled: {
    fontWeight: '400',
    color: tokens.colorNeutralForegroundDisabled,
    borderLeft: '3px solid transparent',
    cursor: 'default',
  },
  groupContainer: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  groupHeader: {
    ...shorthands.padding('10px', '16px'),
    fontSize: '11px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    userSelect: 'none',
  },
  groupChevron: {
    fontSize: '10px',
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.fast,
  },
  groupChevronExpanded: {
    transform: 'rotate(90deg)',
  },
  subGroupHeader: {
    ...shorthands.padding('6px', '16px', '6px', '20px'),
    fontSize: '10px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    userSelect: 'none',
  },
  subGroupChevron: {
    fontSize: '8px',
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.fast,
  },
});

// ─── NavItem ─────────────────────────────────────────────────────────────────

export interface INavItemProps {
  label: string;
  path: string;
  isActive: boolean;
  indent?: number;
  disabled?: boolean;
  onNavigate: (path: string) => void;
  onPreload: (path: string) => void;
}

export const NavItemComponent = React.memo<INavItemProps>(
  ({ label, path, isActive, indent = 0, disabled, onNavigate, onPreload }) => {
    const styles = useStyles();
    const handleClick = disabled ? undefined : () => onNavigate(path);
    const handleMouseEnter = disabled ? undefined : () => onPreload(path);

    return (
      <div
        role="link"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onKeyDown={disabled ? undefined : (e) => { if (e.key === 'Enter') onNavigate(path); }}
        className={mergeClasses(
          styles.navItem,
          isActive ? styles.navItemActive : disabled ? styles.navItemDisabled : styles.navItemInactive,
        )}
        style={{ padding: `7px 16px 7px ${16 + indent * 12}px` }}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={disabled || undefined}
      >
        {label}
      </div>
    );
  },
);
NavItemComponent.displayName = 'NavItemComponent';

// ─── NavGroup ────────────────────────────────────────────────────────────────

export interface INavGroupProps {
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const NavGroup: React.FC<INavGroupProps> = ({ label, children, defaultExpanded = false }) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className={styles.groupContainer}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        className={styles.groupHeader}
        aria-expanded={expanded}
      >
        <span>{label}</span>
        <span className={mergeClasses(styles.groupChevron, expanded ? styles.groupChevronExpanded : undefined)}>
          &#9654;
        </span>
      </div>
      {expanded && children}
    </div>
  );
};

// ─── NavSubGroup ─────────────────────────────────────────────────────────────

export interface INavSubGroupProps {
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const NavSubGroup: React.FC<INavSubGroupProps> = ({ label, children, defaultExpanded = true }) => {
  const styles = useStyles();
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        className={styles.subGroupHeader}
        aria-expanded={expanded}
      >
        <span className={mergeClasses(styles.subGroupChevron, expanded ? styles.groupChevronExpanded : undefined)}>
          &#9654;
        </span>
        <span>{label}</span>
      </div>
      {expanded && children}
    </div>
  );
};
