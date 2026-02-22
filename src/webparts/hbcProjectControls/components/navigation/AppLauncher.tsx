/**
 * AppLauncher.tsx — Fluent UI workspace grid launcher.
 * Opens from a button in the AppShell header. Displays workspace tiles
 * filtered by user roles via NAV_GROUP_ROLES. Clicking a tile navigates
 * to the workspace basePath.
 */
import * as React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Grid24Regular,
  Notepad24Regular,
  BuildingFactory24Regular,
  People24Regular,
  ShieldCheckmark24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { NAV_GROUP_ROLES } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { LAUNCHER_WORKSPACES, type IWorkspaceDefinition, type WorkspaceId } from './workspaceConfig';
import { useWorkspace } from './WorkspaceContext';
import { TOUCH_TARGET } from '../../theme/tokens';

// ─── Icon Resolution ─────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactElement> = {
  Notepad24Regular: <Notepad24Regular />,
  BuildingFactory24Regular: <BuildingFactory24Regular />,
  People24Regular: <People24Regular />,
  ShieldCheckmark24Regular: <ShieldCheckmark24Regular />,
  Settings24Regular: <Settings24Regular />,
};

function resolveIcon(iconName: string): React.ReactElement {
  return ICON_MAP[iconName] ?? <Grid24Regular />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  triggerButton: {
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    ...shorthands.padding('4px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TOUCH_TARGET.min,
    minHeight: TOUCH_TARGET.min,
    ...shorthands.borderRadius('4px'),
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    ':focus-visible': {
      ...shorthands.outline('2px', 'solid', tokens.colorStrokeFocus2),
      outlineOffset: '2px',
    },
  },
  menuPopover: {
    minWidth: '220px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    fontSize: '14px',
  },
  menuItemActive: {
    fontWeight: '600',
  },
  menuItemIcon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
  },
});

// ─── Component ───────────────────────────────────────────────────────────────

export const AppLauncher: React.FC = React.memo(() => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { currentUser, isFeatureEnabled } = useAppContext();
  const { activeWorkspaceId } = useWorkspace();
  const userRoles = currentUser?.roles ?? [];

  // Filter workspaces by role access
  const visibleWorkspaces = React.useMemo(() => {
    return LAUNCHER_WORKSPACES.filter((ws: IWorkspaceDefinition) => {
      // Feature flag gating
      if (ws.featureFlag && !isFeatureEnabled(ws.featureFlag)) return false;
      // If no requiredGroupKeys, always visible
      if (ws.requiredGroupKeys.length === 0) return true;
      // Check if user has any role that grants access to any required group
      return ws.requiredGroupKeys.some(groupKey => {
        const allowedRoles = NAV_GROUP_ROLES[groupKey];
        return allowedRoles && userRoles.some(r => allowedRoles.includes(r));
      });
    });
  }, [userRoles, isFeatureEnabled]);

  // Stable click handler — uses workspace basePath
  const handleSelect = React.useCallback(
    (_e: unknown, data: { name: string }) => {
      navigate(data.name);
    },
    [navigate],
  );

  if (visibleWorkspaces.length === 0) return null;

  return (
    <Menu onCheckedValueChange={undefined}>
      <MenuTrigger disableButtonEnhancement>
        <button
          className={styles.triggerButton}
          aria-label="Open workspace launcher"
          title="Workspaces"
        >
          <Grid24Regular />
        </button>
      </MenuTrigger>
      <MenuPopover className={styles.menuPopover}>
        <MenuList>
          {visibleWorkspaces.map((ws: IWorkspaceDefinition) => (
            <MenuItem
              key={ws.id}
              onClick={() => handleSelect(null, { name: ws.basePath })}
              className={styles.menuItem}
            >
              <span className={styles.menuItemIcon}>{resolveIcon(ws.iconName)}</span>
              <span className={ws.id === (activeWorkspaceId as WorkspaceId) ? styles.menuItemActive : undefined}>
                {ws.label}
              </span>
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
});
AppLauncher.displayName = 'AppLauncher';
