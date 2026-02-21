import * as React from 'react';
import { makeStyles, shorthands, mergeClasses, tokens } from '@fluentui/react-components';
import {
  Home24Regular,
  Notepad24Regular,
  BuildingFactory24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppContext } from '../contexts/AppContext';
import { NAV_GROUP_ROLES } from '@hbc/sp-services';
import { TOUCH_TARGET } from '../../theme/tokens';

export type PillarId = 'hub' | 'precon' | 'ops' | 'admin';

export interface IPillarDef {
  id: PillarId;
  label: string;
  basePath: string;
  icon: React.ReactNode;
  /** NAV_GROUP_ROLES keys that grant access to this pillar */
  roleKeys: string[];
}

export const PILLARS: IPillarDef[] = [
  {
    id: 'hub',
    label: 'Hub',
    basePath: '/',
    icon: <Home24Regular />,
    roleKeys: ['Marketing'],
  },
  {
    id: 'precon',
    label: 'Precon',
    basePath: '/preconstruction',
    icon: <Notepad24Regular />,
    roleKeys: ['Preconstruction'],
  },
  {
    id: 'ops',
    label: 'Ops',
    basePath: '/operations',
    icon: <BuildingFactory24Regular />,
    roleKeys: ['Operations'],
  },
  {
    id: 'admin',
    label: 'Admin',
    basePath: '/admin',
    icon: <Settings24Regular />,
    roleKeys: ['Admin'],
  },
];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('2px'),
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': { display: 'none' },
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('0', '12px'),
    height: '36px',
    minWidth: TOUCH_TARGET.min,
    ...shorthands.border('0'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transitionProperty: 'background-color, color',
    transitionDuration: tokens.durationFaster,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#fff',
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '2px',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transitionDuration: tokens.durationUltraFast,
    },
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontWeight: '600',
  },
  tabIcon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
  },
});

/**
 * Determine which pillar is active based on current pathname.
 */
export function getActivePillar(pathname: string): PillarId {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/operations')) return 'ops';
  if (pathname.startsWith('/preconstruction') || pathname.startsWith('/lead') || pathname.startsWith('/job-request')) return 'precon';
  return 'hub';
}

/**
 * Map a pillar ID to the NAV_STRUCTURE groupKeys that belong to it.
 */
export function getPillarGroupKeys(pillar: PillarId): string[] {
  switch (pillar) {
    case 'hub': return ['Marketing'];
    case 'precon': return ['Preconstruction'];
    case 'ops': return ['Operations'];
    case 'admin': return ['Admin', 'Accounting'];
  }
}

// §4: React.memo + stable hooks prevent re-render cascade — see Router Stability Rule
const PillarTabBarInner: React.FC = () => {
  const styles = useStyles();
  const location = useAppLocation();
  const navigate = useAppNavigate();
  const { currentUser } = useAppContext();
  const userRoles = currentUser?.roles ?? [];

  const activePillar = getActivePillar(location.pathname);

  const isPillarVisible = React.useCallback((pillar: IPillarDef): boolean => {
    return pillar.roleKeys.some(key => {
      const allowed = NAV_GROUP_ROLES[key];
      return allowed && userRoles.some(r => allowed.includes(r));
    });
  }, [userRoles]);

  // §4: memoized to prevent re-render cascade — see Router Stability Rule
  const visibleTabs = React.useMemo(
    () => PILLARS.filter(isPillarVisible),
    [isPillarVisible]
  );

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const path = e.currentTarget.dataset.path;
    if (path) navigate(path);
  }, [navigate]); // navigate has stable identity (useAppNavigate uses empty deps)

  return (
    <div className={styles.container} role="tablist" aria-label="Navigation pillars">
      {visibleTabs.map(pillar => (
        <button
          key={pillar.id}
          role="tab"
          aria-selected={pillar.id === activePillar}
          className={mergeClasses(styles.tab, pillar.id === activePillar && styles.tabActive)}
          data-path={pillar.basePath}
          onClick={handleClick}
        >
          <span className={styles.tabIcon}>{pillar.icon}</span>
          {pillar.label}
        </button>
      ))}
    </div>
  );
};

export const PillarTabBar = React.memo(PillarTabBarInner);
