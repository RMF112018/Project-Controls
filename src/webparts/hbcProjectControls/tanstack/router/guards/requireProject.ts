import { redirect } from '@tanstack/react-router';
import type { ITanStackRouteContext } from '../routeContext';

export function requireProject(context: ITanStackRouteContext): void {
  // HBC-PC-UUID-001: Accept either projectCode or projectUuid as valid project identity
  if (!context.selectedProject?.projectCode && !context.selectedProject?.projectUuid) {
    throw redirect({ to: '/', replace: true });
  }
}

