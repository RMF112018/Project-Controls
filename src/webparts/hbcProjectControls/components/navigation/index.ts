// Navigation module barrel export
export { AppLauncher } from './AppLauncher';
export { ContextualSidebar } from './ContextualSidebar';
export { useWorkspace } from './WorkspaceContext';
export { NavItemComponent, NavGroup, NavSubGroup } from './NavPrimitives';
export type { INavItemProps, INavGroupProps, INavSubGroupProps } from './NavPrimitives';
export type { IWorkspaceState } from './WorkspaceContext';
export {
  WORKSPACES,
  WORKSPACE_MAP,
  LAUNCHER_WORKSPACES,
  getWorkspaceFromPath,
} from './workspaceConfig';
export type {
  WorkspaceId,
  IWorkspaceDefinition,
  ISidebarItem,
  ISidebarSubGroup,
  ISidebarGroup,
} from './workspaceConfig';
