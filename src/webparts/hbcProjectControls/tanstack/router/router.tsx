import * as React from 'react';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { IDataService, ICurrentUser } from '@hbc/sp-services';
import type { IQueryScope } from '../query/queryKeys';
import { tanStackPilotRouteTree } from './routes.activeProjects';

export interface ITanStackRouterProviderProps {
  queryClient: QueryClient;
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  activeProjectCode: string | null;
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
      activeProjectCode: initialContext.activeProjectCode,
      isFeatureEnabled: initialContext.isFeatureEnabled,
      scope: initialContext.scope,
    },
    history: createHashHistory(),
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
  });
}

export const TanStackPilotRouter: React.FC<ITanStackRouterProviderProps> = ({
  queryClient,
  dataService,
  currentUser,
  activeProjectCode,
  isFeatureEnabled,
  scope,
}) => {
  const [router] = React.useState(() => createHbcTanStackRouter({
    queryClient,
    dataService,
    currentUser,
    activeProjectCode,
    isFeatureEnabled,
    scope,
  }));

  return (
    <RouterProvider
      router={router}
      context={{
        queryClient,
        dataService,
        currentUser,
        activeProjectCode,
        isFeatureEnabled,
        scope,
      }}
    />
  );
};

export const TanStackAppRouterProvider = TanStackPilotRouter;
