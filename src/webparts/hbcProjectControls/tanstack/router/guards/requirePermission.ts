import { redirect } from '@tanstack/react-router';
import { ROLE_PERMISSIONS, normalizeRoleName } from '@hbc/sp-services';
import type { ITanStackRouteContext } from '../routeContext';

export function requirePermission(context: ITanStackRouteContext, permission: string): void {
  const directPermissions = context.currentUser?.permissions;
  if (directPermissions?.has(permission)) {
    return;
  }

  const userRoles = context.currentUser?.roles ?? [];
  const derivedPermissions = new Set<string>();
  for (const role of userRoles) {
    const normalized = normalizeRoleName(role);
    const rolePermissions = ROLE_PERMISSIONS[normalized];
    if (!rolePermissions) continue;
    for (const grantedPermission of rolePermissions) {
      derivedPermissions.add(grantedPermission);
    }
  }

  if (!derivedPermissions.has(permission)) {
    throw redirect({ to: '/access-denied', replace: true });
  }
}
