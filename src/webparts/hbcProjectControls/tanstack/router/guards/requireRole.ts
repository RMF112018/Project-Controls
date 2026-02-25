import { redirect } from '@tanstack/react-router';
import type { ITanStackRouteContext } from '../routeContext';

/**
 * Stage 2 (sub-task 5) — Role-based route guard.
 * Checks that the current user holds at least one of the allowedRoles.
 * Redirects to /access-denied when no match is found.
 */
export function requireRole(context: ITanStackRouteContext, allowedRoles: string[]): void {
  const userRoles = context.currentUser?.roles;
  if (!userRoles || !userRoles.some(r => allowedRoles.includes(r))) {
    throw redirect({ to: '/access-denied', replace: true });
  }
}
