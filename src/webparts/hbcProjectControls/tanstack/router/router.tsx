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
  // ── 1. Create router exactly ONCE with REAL initial values ──────────
  // useRef lazy-init captures the first render's props so guards and
  // loaders see correct context on the very first route evaluation.
  // Dynamic value changes are handled by useEffect (step 3).
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

  // ── 2. Memoize context — only changes when a value actually changes ──
  const routerContext = React.useMemo(() => ({
    queryClient,
    dataService,
    currentUser,
    selectedProject,
    isFeatureEnabled,
    scope,
  }), [queryClient, dataService, currentUser, selectedProject, isFeatureEnabled, scope]);

  // ── 3. Deferred context update via useEffect ──────────────────────────
  // CRITICAL: router.update() must NOT run during render.
  // RouterProvider with a context prop calls router.update() synchronously
  // during render. When async loaders keep the router in "pending" state,
  // this creates an infinite synchronous re-render loop:
  //   render → router.update() → store notify → re-render → ...
  // Moving to useEffect breaks this cycle — updates happen after commit.
  React.useEffect(() => {
    routerRef.current!.update({
      ...routerRef.current!.options,
      context: routerContext,
    });
  }, [routerContext]);

  // ── 4. NO context prop — prevents RouterContextProvider from calling
  //       router.update() synchronously during render ──────────────────
  return (
    <RouterProvider
      router={routerRef.current!}
    />
  );
};

export const TanStackAppRouterProvider = TanStackPilotRouter;
