/**
 * ContextualSidebar.tsx — Workspace-aware sidebar navigation.
 * Reads the active workspace from useWorkspace() and renders
 * the corresponding sidebar groups using NavPrimitives.
 *
 * Replaces NavigationSidebar when uxSuiteNavigationV1 is enabled.
 */
import * as React from 'react';
import { useRouter } from '@tanstack/react-router';
import { makeStyles, tokens } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { EnhancedProjectPicker } from '../shared/EnhancedProjectPicker';
import { ContextKPIStrip } from '../shared/ContextKPIStrip';
import { NavItemComponent, NavGroup, NavSubGroup } from './NavPrimitives';
import { useWorkspace } from './WorkspaceContext';
import type { ISidebarItem, ISidebarGroup, ISidebarSubGroup } from './workspaceConfig';

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
  workspaceLabel: {
    padding: '12px 16px 4px 16px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: tokens.colorNeutralForeground4,
  },
  dashboardSection: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

export const ContextualSidebar: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const location = useAppLocation();
  const router = useRouter();
  const { currentUser, selectedProject, setSelectedProject, hasPermission, isFeatureEnabled, isProjectSite } = useAppContext();
  const { activeWorkspace, sidebarGroups } = useWorkspace();

  // Stable preload callback — router instance is a singleton
  const handlePreload = React.useCallback((path: string) => {
    router.preloadRoute({ to: path });
  }, [router]);

  const isActivePath = React.useCallback((path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  const isItemVisible = React.useCallback((item: ISidebarItem): boolean => {
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.hubOnly && selectedProject) return false;
    return true;
  }, [isFeatureEnabled, hasPermission, selectedProject]);

  const renderItems = React.useCallback((items: ISidebarItem[], indent = 0): React.ReactNode => {
    return items.filter(isItemVisible).map(item => (
      <NavItemComponent
        key={item.path}
        label={item.label}
        path={item.path}
        isActive={isActivePath(item.path)}
        indent={indent}
        disabled={item.requiresProject && !selectedProject}
        onNavigate={navigate}
        onPreload={handlePreload}
      />
    ));
  }, [isItemVisible, isActivePath, selectedProject, navigate, handlePreload]);

  const renderSubGroups = React.useCallback((subGroups: ISidebarSubGroup[]): React.ReactNode => {
    return subGroups.map(sg => {
      const visibleItems = sg.items.filter(isItemVisible);
      if (visibleItems.length === 0) return null;
      return (
        <NavSubGroup key={sg.label} label={sg.label} defaultExpanded={sg.defaultExpanded}>
          {visibleItems.map(item => (
            <NavItemComponent
              key={item.path}
              label={item.label}
              path={item.path}
              isActive={isActivePath(item.path)}
              indent={1}
              disabled={item.requiresProject && !selectedProject}
              onNavigate={navigate}
              onPreload={handlePreload}
            />
          ))}
        </NavSubGroup>
      );
    });
  }, [isItemVisible, isActivePath, selectedProject, navigate, handlePreload]);

  const renderGroup = React.useCallback((group: ISidebarGroup): React.ReactNode => {
    const visibleItems = group.items.filter(isItemVisible);
    const hasSubContent = group.subGroups && group.subGroups.some(sg => sg.items.some(isItemVisible));
    if (visibleItems.length === 0 && !hasSubContent) return null;

    const isExpanded = visibleItems.some(i => isActivePath(i.path)) ||
      (group.subGroups?.some(sg => sg.items.some(i => isActivePath(i.path))) ?? false);

    return (
      <NavGroup key={group.key} label={group.label} defaultExpanded={isExpanded}>
        {renderItems(group.items)}
        {group.subGroups && renderSubGroups(group.subGroups)}
      </NavGroup>
    );
  }, [isItemVisible, isActivePath, renderItems, renderSubGroups]);

  // Dynamic lead items when a project with leadId is selected
  const renderDynamicLeadItems = React.useCallback((): React.ReactNode => {
    if (!selectedProject?.leadId) return null;
    const leadId = selectedProject.leadId;
    return (
      <>
        <NavItemComponent
          label="Lead Detail"
          path={`/lead/${leadId}`}
          isActive={isActivePath(`/lead/${leadId}`)}
          onNavigate={navigate}
          onPreload={handlePreload}
        />
        <NavItemComponent
          label="Go/No-Go"
          path={`/lead/${leadId}/gonogo`}
          isActive={isActivePath(`/lead/${leadId}/gonogo`)}
          onNavigate={navigate}
          onPreload={handlePreload}
        />
      </>
    );
  }, [selectedProject?.leadId, isActivePath, navigate, handlePreload]);

  return (
    <nav className={styles.nav} aria-label={`${activeWorkspace.label} navigation`}>
      {/* Project Picker — always shown */}
      <EnhancedProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      {/* KPI Strip */}
      <ContextKPIStrip />

      {/* Workspace label */}
      <div className={styles.workspaceLabel}>{activeWorkspace.label}</div>

      {/* Dashboard — always visible at top */}
      <div className={styles.dashboardSection}>
        <NavItemComponent
          label="Dashboard"
          path="/"
          isActive={isActivePath('/')}
          onNavigate={navigate}
          onPreload={handlePreload}
        />
      </div>

      {/* Workspace-specific sidebar groups */}
      {sidebarGroups.map(group => renderGroup(group))}

      {/* Dynamic lead items for preconstruction */}
      {activeWorkspace.id === 'preconstruction' && renderDynamicLeadItems()}
    </nav>
  );
};
