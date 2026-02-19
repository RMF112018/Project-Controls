import { redirect } from '@tanstack/react-router';
import type { ITanStackRouteContext } from '../routeContext';

export function requireProject(context: ITanStackRouteContext): void {
  if (!context.selectedProject?.projectCode) {
    throw redirect({ to: '/operations', replace: true });
  }
}

