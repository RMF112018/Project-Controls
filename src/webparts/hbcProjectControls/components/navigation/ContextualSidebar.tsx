import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useWorkspace } from './WorkspaceContext';
import { NavGroup, NavItem } from './NavPrimitives';

const useStyles = makeStyles({
  sidebar: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  noWorkspace: {
    ...shorthands.padding('16px'),
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

export const ContextualSidebar: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const location = useAppLocation();
  const { selectedProject, setSelectedProject, isProjectSite } = useAppContext();
  const { workspace } = useWorkspace();

  const isActivePath = React.useCallback((path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  return (
    <nav className={styles.sidebar} aria-label="Workspace navigation">
      <ProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      <div className={styles.divider} />

      {workspace ? (
        workspace.sidebarGroups.map(group => (
          <NavGroup key={group.label} label={group.label}>
            {group.items.map(item => (
              <NavItem
                key={item.path}
                label={item.label}
                active={isActivePath(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </NavGroup>
        ))
      ) : (
        <div className={styles.noWorkspace}>
          Select a workspace from the launcher above.
        </div>
      )}
    </nav>
  );
};
