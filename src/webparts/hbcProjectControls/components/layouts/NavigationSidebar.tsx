import * as React from 'react';
import { makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { HBC_COLORS, TRANSITION } from '../../theme/tokens';

const useStyles = makeStyles({
  nav: {
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  dashboardSection: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
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
});

export const NavigationSidebar: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const location = useAppLocation();
  const { selectedProject, setSelectedProject, isProjectSite } = useAppContext();

  const isActivePath = React.useCallback((path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <ProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      <div className={styles.dashboardSection}>
        <div
          onClick={() => navigate('/')}
          className={mergeClasses(
            styles.navItem,
            isActivePath('/') ? styles.navItemActive : styles.navItemInactive,
          )}
          style={{ padding: '7px 16px' }}
        >
          Dashboard
        </div>
        <div
          onClick={() => navigate('/preconstruction')}
          className={mergeClasses(
            styles.navItem,
            isActivePath('/preconstruction') ? styles.navItemActive : styles.navItemInactive,
          )}
          style={{ padding: '7px 16px' }}
        >
          Preconstruction
        </div>
      </div>
    </nav>
  );
};
