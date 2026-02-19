import * as React from 'react';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { IDataService, ICurrentUser } from '@hbc/sp-services';
import type { IQueryScope } from '../query/queryKeys';
import type { ISelectedProject } from '../../components/contexts/AppContext';
import { tanStackPilotRouteTree } from './routes.activeProjects';

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
  const router = React.useMemo(() => createHbcTanStackRouter({
    queryClient,
    dataService,
    currentUser,
    selectedProject,
    isFeatureEnabled,
    scope,
  }), [queryClient, dataService, currentUser, selectedProject, isFeatureEnabled, scope]);

  return (
    <RouterProvider
      router={router}
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
