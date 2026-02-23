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
import { Grid24Regular } from '@fluentui/react-icons';
import { RoleGate } from '../guards/RoleGate';
import { FeatureGate } from '../guards/FeatureGate';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppContext } from '../contexts/AppContext';
import { LAUNCHER_WORKSPACES } from './workspaceConfig';
import { HBC_COLORS, TRANSITION } from '../../theme/tokens';

const useStyles = makeStyles({
  trigger: {
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: '#fff',
    cursor: 'pointer',
    ...shorthands.padding('4px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('4px'),
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
  popover: {
    ...shorthands.padding('8px'),
    minWidth: '200px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  label: {
    fontWeight: 500,
    color: HBC_COLORS.navy,
  },
  description: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  workspaceTile: {
    transitionProperty: 'transform',
    transitionDuration: TRANSITION.fast,
    ':hover': {
      transform: 'scale(1.01)',
    },
  },
});

export const AppLauncher: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { selectedProject } = useAppContext();

  // Filter out workspaces that require a project when none is selected
  const visibleWorkspaces = React.useMemo(
    () => LAUNCHER_WORKSPACES.filter(w => !w.requireProject || selectedProject),
    [selectedProject],
  );

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <button
          className={styles.trigger}
          aria-label="Open workspace launcher"
          title="Switch workspace"
        >
          <Grid24Regular />
        </button>
      </MenuTrigger>

      <MenuPopover className={styles.popover}>
        <MenuList>
          {visibleWorkspaces.map(workspace => {
            const item = (
              <MenuItem
                key={workspace.id}
                className={styles.workspaceTile}
                onClick={() => navigate(workspace.basePath)}
              >
                <div className={styles.menuItem}>
                  <span className={styles.label}>{workspace.label}</span>
                </div>
              </MenuItem>
            );

            // Wrap with FeatureGate if workspace has a feature flag
            const featureGated = workspace.featureFlag
              ? <FeatureGate key={workspace.id} featureName={workspace.featureFlag}>{item}</FeatureGate>
              : item;

            // Wrap with RoleGate
            return (
              <RoleGate key={workspace.id} allowedRoles={workspace.roles}>
                {featureGated}
              </RoleGate>
            );
          })}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
