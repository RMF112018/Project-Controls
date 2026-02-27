import { redirect } from '@tanstack/react-router';
import { normalizeRoleName } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';

/**
 * Stage 2 (sub-task 5) — Role-based route guard.
 * Checks that the current user holds at least one of the allowedRoles.
 * Redirects to /access-denied when no match is found.
 */
export function requireRole(context: ITanStackRouteContext, allowedRoles: string[]): void {
  const userRoles = context.currentUser?.roles;
  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRoleName(role));
  const normalizedUserRoles = userRoles?.map((role) => normalizeRoleName(role));
  if (!normalizedUserRoles || !normalizedUserRoles.some((role) => normalizedAllowedRoles.includes(role))) {
    throw redirect({ to: '/access-denied', replace: true });
  }
}
