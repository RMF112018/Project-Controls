/**
 * HBC-PC-NAV-001 / HBC-PC-UUID-001 / HBC-PC-PID-001 — navigateWithProject
 *
 * Navigation helper that carries `pid` (7-char hex prefix of projectUuid)
 * as the canonical project identifier in URL search params. All multi-project
 * → Project Hub links MUST use this helper.
 *
 * Produces pid-only URLs (e.g., `?pid=af28129`). No projectCode or leadId.
 */
import type { NavigateFn } from '@tanstack/react-router';
import { toShortPid } from './projectPid';

export interface INavigateWithProjectOptions {
  /** TanStack Router navigate function from useNavigate(). */
  navigate: NavigateFn;
  /** Target route path (e.g., '/project-hub/dashboard'). */
  to: string;
  /** The canonical immutable project UUID (full). Shortened to pid in URL. */
  projectUuid: string;
  /** Replace current history entry rather than pushing. */
  replace?: boolean;
  /** Additional search params to merge. */
  extraSearch?: Record<string, unknown>;
}

/**
 * Navigate to a Project Hub route while attaching the `pid` search param.
 * Per HBC-PC-PID-001, this produces short-pid URLs (e.g., `?pid=af28129`).
 *
 * @example
 * ```ts
 * const navigate = useNavigate();
 * navigateWithProject({
 *   navigate,
 *   to: '/project-hub/dashboard',
 *   projectUuid: 'a1b2c3d4-...',
 * });
 * // URL: /project-hub/dashboard?pid=a1b2c3d
 * ```
 */
export function navigateWithProject(options: INavigateWithProjectOptions): void {
  const { navigate, to, projectUuid, replace, extraSearch } = options;

  void navigate({
    to,
    replace,
    search: {
      pid: toShortPid(projectUuid),
      ...extraSearch,
    },
  });
}
