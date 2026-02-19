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

function createHbcTanStackRouter() {
  return createRouter({
    routeTree: tanStackPilotRouteTree,
    context: {
      queryClient: undefined as unknown as QueryClient,
      dataService: undefined as unknown as IDataService,
      currentUser: null,
      selectedProject: null,
      isFeatureEnabled: () => false,
      scope: {
        mode: 'mock',
        siteContext: 'hub',
        siteUrl: '',
        projectCode: null,
      },
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
  const router = React.useMemo(() => createHbcTanStackRouter(), []);

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
