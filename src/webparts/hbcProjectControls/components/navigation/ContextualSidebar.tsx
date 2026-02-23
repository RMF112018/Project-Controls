/**
 * ContextualSidebar — Workspace-aware accordion sidebar.
 *
 * Driven by workspaceConfig.ts. Accordion behavior (v1.1):
 * - All groups start collapsed on workspace load.
 * - Only one group open at a time (auto-collapse others).
 * - Expanded state persisted per workspace via localStorage.
 * - Auto-expands group containing active route on direct URL navigation.
 * - Fluent UI Accordion provides built-in smooth motion.
 */
import * as React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ProjectPicker } from '../shared/ProjectPicker';
import { useAppNavigate } from '../hooks/router/useAppNavigate';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { useWorkspace } from './WorkspaceContext';
import { NavItem } from './NavPrimitives';

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  persistentSection: {
    ...shorthands.padding('4px', '0'),
  },
  persistentDivider: {
    ...shorthands.margin('4px', '0'),
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  accordionHeader: {
    fontSize: '10px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  noWorkspace: {
    ...shorthands.padding('16px'),
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

// ─── localStorage Persistence ─────────────────────────────────────────────────

function getPersistedGroup(wsId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(`hbc:sidebar-accordion:${wsId}`);
  } catch {
    return null;
  }
}

function setPersistedGroup(wsId: string, groupLabel: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (groupLabel) {
      window.localStorage.setItem(`hbc:sidebar-accordion:${wsId}`, groupLabel);
    } else {
      window.localStorage.removeItem(`hbc:sidebar-accordion:${wsId}`);
    }
  } catch {
    // best-effort persistence
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

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

  // For non-hub workspaces, filter out items whose path matches the workspace basePath
  // to avoid duplication with the persistent "{Workspace} Dashboard" link.
  // Also remove groups that become empty after filtering.
  const filteredGroups = React.useMemo(() => {
    if (!workspace || workspace.id === 'hub') return workspace?.sidebarGroups ?? [];
    return workspace.sidebarGroups
      .map(g => ({ ...g, items: g.items.filter(i => i.path !== workspace.basePath) }))
      .filter(g => g.items.length > 0);
  }, [workspace]);

  const isNonHubWorkspace = workspace && workspace.id !== 'hub';

  // ── Accordion State ───────────────────────────────────────────────────────

  const [openItems, setOpenItems] = React.useState<string[]>([]);

  // On workspace change: restore persisted group or auto-expand active route group
  React.useEffect(() => {
    if (!workspace) {
      setOpenItems([]);
      return;
    }
    const persisted = getPersistedGroup(workspace.id);
    if (persisted && filteredGroups.some(g => g.label === persisted)) {
      setOpenItems([persisted]);
    } else {
      // Auto-expand group containing active route (handles direct URL / bookmark navigation)
      const activeGroup = filteredGroups.find(g =>
        g.items.some(item => isActivePath(item.path))
      );
      if (activeGroup) {
        setOpenItems([activeGroup.label]);
        setPersistedGroup(workspace.id, activeGroup.label);
      } else {
        setOpenItems([]);
      }
    }
  }, [workspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single-open toggle handler with localStorage persistence
  const handleToggle = React.useCallback(
    (_: unknown, data: { openItems: string[] }) => {
      setOpenItems(data.openItems);
      if (workspace) {
        const expanded = data.openItems.length > 0
          ? data.openItems[data.openItems.length - 1]
          : null;
        setPersistedGroup(workspace.id, expanded);
      }
    },
    [workspace],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <nav className={styles.sidebar} aria-label="Workspace navigation">
      <ProjectPicker selected={selectedProject} onSelect={setSelectedProject} locked={isProjectSite} />

      <div className={styles.divider} />

      {workspace ? (
        <>
          {/* Persistent "Home" + "{Workspace} Dashboard" links for non-hub workspaces */}
          {isNonHubWorkspace && (
            <>
              <div className={styles.persistentSection}>
                <NavItem
                  label="Home"
                  active={location.pathname === '/'}
                  onClick={() => navigate('/')}
                />
                <NavItem
                  label={`${workspace.label} Dashboard`}
                  active={location.pathname === workspace.basePath}
                  onClick={() => navigate(workspace.basePath)}
                />
                {selectedProject && workspace.id !== 'project-hub' && (
                  <NavItem
                    label="Project Hub"
                    active={location.pathname.startsWith('/project-hub')}
                    onClick={() => navigate('/project-hub/dashboard')}
                  />
                )}
              </div>
              <div className={styles.persistentDivider} />
            </>
          )}

          {/* Workspace sidebar groups — accordion with single-open behavior */}
          <Accordion
            collapsible
            openItems={openItems}
            onToggle={handleToggle}
          >
            {filteredGroups.map(group => (
              <AccordionItem key={group.label} value={group.label}>
                <AccordionHeader>
                  <span className={styles.accordionHeader}>{group.label}</span>
                </AccordionHeader>
                <AccordionPanel>
                  {group.items.map(item => (
                    <NavItem
                      key={item.path}
                      label={item.label}
                      active={isActivePath(item.path)}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      ) : (
        <div className={styles.noWorkspace}>
          Select a workspace from the launcher above.
        </div>
      )}
    </nav>
  );
};
