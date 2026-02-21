import * as React from 'react';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { IDataService, ICurrentUser } from '@hbc/sp-services';
import type { IQueryScope } from '../query/queryKeys';
import type { ISelectedProject } from '../../components/contexts/AppContext';
import { tanStackPilotRouteTree } from './routes.activeProjects';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
import { RouteErrorBoundary } from '../../components/boundaries/RouteErrorBoundary';

export interface ITanStackRouterProviderProps {
  queryClient: QueryClient;
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  selectedProject: ISelectedProject | null;
  isFeatureEnabled: (featureName: string) => boolean;
  scope: IQueryScope;
}

export function createHbcTanStackRouter(initialContext: ITanStackRouterProviderProps) {
  return createRouter({
    routeTree: tanStackPilotRouteTree,
    context: {
      queryClient: initialContext.queryClient,
      dataService: initialContext.dataService,
      currentUser: initialContext.currentUser,
      selectedProject: initialContext.selectedProject,
      isFeatureEnabled: initialContext.isFeatureEnabled,
      scope: initialContext.scope,
    },
    history: createHashHistory(),
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    defaultPendingComponent: RouteSuspenseFallback,
    defaultErrorComponent: RouteErrorBoundary,
  });
}

export const TanStackPilotRouter: React.FC<ITanStackRouterProviderProps> = ({
  queryClient,
  dataService,
  currentUser,
  selectedProject,
  isFeatureEnabled,
  scope,
}) => {
  // Create router exactly ONCE. Route tree, hash history, preload config, and
  // fallback components are static. Dynamic values (currentUser, selectedProject,
  // scope, isFeatureEnabled) flow through the RouterProvider context prop, which
  // calls router.update() in-place — no route tree destruction, no guard/loader
  // re-execution, no component unmount/remount.
  const routerRef = React.useRef<ReturnType<typeof createHbcTanStackRouter> | null>(null);
  if (routerRef.current === null) {
    routerRef.current = createHbcTanStackRouter({
      queryClient,
      dataService,
      currentUser,
      selectedProject,
      isFeatureEnabled,
      scope,
    });
  }

  return (
    <RouterProvider
      router={routerRef.current}
      context={{
        queryClient,
        dataService,
        currentUser,
        selectedProject,
        isFeatureEnabled,
        scope,
      }}
    />
  );
};

export const TanStackAppRouterProvider = TanStackPilotRouter;
