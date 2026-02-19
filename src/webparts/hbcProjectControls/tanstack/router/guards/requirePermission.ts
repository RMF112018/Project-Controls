import { redirect } from '@tanstack/react-router';
import type { ITanStackRouteContext } from '../routeContext';

export function requirePermission(context: ITanStackRouteContext, permission: string): void {
  const permissions = context.currentUser?.permissions;
  if (!permissions || !permissions.has(permission)) {
    throw redirect({ to: '/access-denied', replace: true });
  }
}

