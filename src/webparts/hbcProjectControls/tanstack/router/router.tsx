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
  // ── 1. Create router exactly ONCE with static-only values ──────────
  // Route tree, hash history, preload config, and fallback components
  // are immutable for the router's lifetime. Dynamic values are injected
  // via useEffect (step 2) and RouterProvider context (step 3).
  const routerRef = React.useRef<ReturnType<typeof createHbcTanStackRouter> | null>(null);
  if (routerRef.current === null) {
    routerRef.current = createHbcTanStackRouter({
      queryClient,
      dataService,
      currentUser: null,
      selectedProject: null,
      isFeatureEnabled: () => false,
      scope: { mode: 'mock', siteContext: 'hub', siteUrl: '', projectCode: null },
    });
  }

  // ── 2. Push dynamic context on every change ────────────────────────
  // router.update() merges context in-place — no route-tree destruction,
  // no guard/loader re-execution, no component unmount/remount.
  React.useEffect(() => {
    routerRef.current!.update({
      ...routerRef.current!.options,
      context: {
        ...routerRef.current!.options.context,
        currentUser,
        selectedProject,
        isFeatureEnabled,
        scope,
      },
    });
  }, [currentUser, selectedProject, isFeatureEnabled, scope]);

  // ── 3. RouterProvider context keeps the React tree in sync ─────────
  return (
    <RouterProvider
      router={routerRef.current!}
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
