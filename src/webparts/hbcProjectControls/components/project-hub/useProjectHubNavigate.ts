/**
 * Stage 20 — useProjectHubNavigate
 *
 * Navigate within Project Hub while preserving projectCode and leadId
 * search params across all internal navigation (sidebar, command bar,
 * breadcrumbs, page-internal links).
 *
 * Dual-source strategy:
 *   1. Primary: URL search params via useSearch({ strict: false })
 *   2. Fallback: AppContext.selectedProject (for ProjectPicker flow)
 *
 * Works both inside and outside ProjectHubProvider — ContextualSidebar
 * lives outside the provider in the component tree:
 *   RouterProvider → AppShell → ContextualSidebar  (OUTSIDE)
 *                             → <Outlet> → ProjectHubLayout → ProjectHubProvider  (INSIDE)
 *
 * Ref: commit 2e69a44cb1806796c944dae81fe4cf3a3a38b453
 */
import * as React from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAppContext } from '../contexts/AppContext';

export interface IProjectHubNavigateOptions {
  replace?: boolean;
  /** Additional search params to merge (e.g., { handoffFrom: 'turnover' }). */
  search?: Record<string, unknown>;
}

export type ProjectHubNavigate = (
  to: string,
  options?: IProjectHubNavigateOptions,
) => void;

/**
 * Navigate within the Project Hub subtree (/project-hub/*) while
 * automatically preserving projectCode and leadId search params.
 *
 * @example
 * ```ts
 * const projectHubNavigate = useProjectHubNavigate();
 * // Simple navigation — params preserved automatically
 * projectHubNavigate('/project-hub/precon/turnover');
 * // With additional search params
 * projectHubNavigate('/project-hub/dashboard', { search: { handoffFrom: 'turnover' } });
 * ```
 */
export function useProjectHubNavigate(): ProjectHubNavigate {
  const tanStackNavigate = useNavigate();
  const navRef = React.useRef(tanStackNavigate);
  navRef.current = tanStackNavigate;

  const searchParams = useSearch({ strict: false }) as {
    projectCode?: string;
    leadId?: number;
  };
  const searchRef = React.useRef(searchParams);
  searchRef.current = searchParams;

  const { selectedProject } = useAppContext();
  const projectRef = React.useRef(selectedProject);
  projectRef.current = selectedProject;

  return React.useCallback<ProjectHubNavigate>(
    (to, options) => {
      const sp = searchRef.current;
      const proj = projectRef.current;

      // Resolve projectCode: URL search params > AppContext selectedProject
      const projectCode = sp.projectCode || proj?.projectCode;
      // Resolve leadId: URL search params > AppContext selectedProject
      const leadId = sp.leadId ?? proj?.leadId;

      void navRef.current({
        to,
        replace: options?.replace,
        search: {
          ...(projectCode ? { projectCode } : {}),
          ...(leadId !== undefined ? { leadId } : {}),
          // Caller can add/override params (e.g., handoffFrom)
          ...options?.search,
        },
      });
    },
    [],
  );
}
