/**
 * Stage 20 / HBC-PC-PID-001 — useProjectHubNavigate
 *
 * Navigate within Project Hub while preserving pid (short project identifier)
 * and leadId search params across all internal navigation (sidebar, command
 * bar, breadcrumbs, page-internal links).
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
import { toShortPid, normalizeToPid } from '../utils/projectPid';

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
 * automatically preserving `pid` (the canonical project identifier).
 * `projectCode` and `leadId` are NOT propagated — pid alone is sufficient.
 *
 * @example
 * ```ts
 * const projectHubNavigate = useProjectHubNavigate();
 * // Simple navigation — pid preserved automatically
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
    pid?: string;         // HBC-PC-PID-001: canonical
    projectUuid?: string; // HBC-PC-UUID-001: backward compat
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

      // HBC-PC-PID-001: Resolve pid only — projectCode and leadId are NOT propagated.
      // pid alone is sufficient; ProjectHubProvider resolves the full project from pid.
      const pid = sp.pid
        || (sp.projectUuid ? normalizeToPid(sp.projectUuid) : undefined)
        || (proj?.projectUuid ? toShortPid(proj.projectUuid) : undefined);

      void navRef.current({
        to,
        replace: options?.replace,
        search: {
          ...(pid ? { pid } : {}),
          // Caller can add/override params (e.g., handoffFrom)
          ...options?.search,
        },
      });
    },
    [],
  );
}
