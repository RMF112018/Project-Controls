import { redirect } from '@tanstack/react-router';
import type { ITanStackRouteContext } from '../routeContext';

export function requireFeature(context: ITanStackRouteContext, featureName: string): void {
  if (!context.isFeatureEnabled(featureName)) {
    throw redirect({ to: '/access-denied', replace: true });
  }
}
