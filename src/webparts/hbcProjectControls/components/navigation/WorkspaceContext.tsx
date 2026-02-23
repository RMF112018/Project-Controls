import { useMemo } from 'react';
import { useAppLocation } from '../hooks/router/useAppLocation';
import { getWorkspaceFromPath, type IWorkspaceConfig } from './workspaceConfig';

export interface IWorkspaceState {
  workspace: IWorkspaceConfig | undefined;
  workspaceId: string | undefined;
}

/**
 * Pure pathname-based workspace derivation.
 * No React context or state — derives workspace from current URL.
 */
export function useWorkspace(): IWorkspaceState {
  const location = useAppLocation();

  return useMemo(() => {
    const workspace = getWorkspaceFromPath(location.pathname);
    return {
      workspace,
      workspaceId: workspace?.id,
    };
  }, [location.pathname]);
}
