/**
 * WorkspaceContext.tsx — Derives active workspace from pathname.
 * Pure computation — no state, no context provider needed.
 */
import * as React from 'react';
import { useAppLocation } from '../hooks/router/useAppLocation';
import {
  getWorkspaceFromPath,
  WORKSPACE_MAP,
  type WorkspaceId,
  type IWorkspaceDefinition,
  type ISidebarGroup,
} from './workspaceConfig';

export interface IWorkspaceState {
  /** Current workspace ID derived from pathname */
  activeWorkspaceId: WorkspaceId;
  /** Full workspace definition */
  activeWorkspace: IWorkspaceDefinition;
  /** Sidebar groups for the active workspace */
  sidebarGroups: ISidebarGroup[];
  /** Whether current route belongs to a departmental workspace (not hub) */
  isDepartmentalRoute: boolean;
}

/**
 * Derives the active workspace from the current URL pathname.
 * No state — purely computed from pathname via useAppLocation().
 */
export function useWorkspace(): IWorkspaceState {
  const { pathname } = useAppLocation();

  return React.useMemo<IWorkspaceState>(() => {
    const workspaceId = getWorkspaceFromPath(pathname);
    const workspace = WORKSPACE_MAP[workspaceId];
    return {
      activeWorkspaceId: workspaceId,
      activeWorkspace: workspace,
      sidebarGroups: workspace.sidebarGroups,
      isDepartmentalRoute: workspaceId !== 'hub',
    };
  }, [pathname]);
}
