import * as React from 'react';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { IDataService, ICurrentUser, ISelectedProject, ITelemetryService } from '@hbc/sp-services';
import type { IQueryScope } from '../query/queryKeys';
import { createTanStackPilotRouteTree } from './routes.activeProjects';
import { RouteSuspenseFallback } from '../../components/boundaries/RouteSuspenseFallback';
import { RouteErrorBoundary } from '../../components/boundaries/RouteErrorBoundary';

export interface ITanStackRouterProviderProps {
  queryClient: QueryClient;
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  selectedProject: ISelectedProject | null;
  isFeatureEnabled: (featureName: string) => boolean;
  scope: IQueryScope;
  telemetryService?: ITelemetryService;
}

export async function createHbcTanStackRouter(initialContext: ITanStackRouterProviderProps) {
  const routeTree = await createTanStackPilotRouteTree(initialContext.telemetryService);

  return createRouter({
    routeTree,
    context: {
      queryClient: initialContext.queryClient,
      dataService: initialContext.dataService,
      currentUser: initialContext.currentUser,
      selectedProject: initialContext.selectedProject,
      isFeatureEnabled: initialContext.isFeatureEnabled,
      scope: initialContext.scope,
      telemetryService: initialContext.telemetryService,
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
  telemetryService,
}) => {
  // Capture initial values so first route evaluation uses the same
  // context shape as prior synchronous router initialization.
  const initialContextRef = React.useRef<ITanStackRouterProviderProps | null>(null);
  if (initialContextRef.current === null) {
    initialContextRef.current = {
      queryClient,
      dataService,
      currentUser,
      selectedProject,
      isFeatureEnabled,
      scope,
      telemetryService,
    };
  }

  const [router, setRouter] = React.useState<Awaited<ReturnType<typeof createHbcTanStackRouter>> | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    void (async () => {
      const nextRouter = await createHbcTanStackRouter(initialContextRef.current!);
      if (isMounted) {
        React.startTransition(() => {
          setRouter(nextRouter);
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 1. Memoize context — only changes when a value actually changes ──
  const routerContext = React.useMemo(() => ({
    queryClient,
    dataService,
    currentUser,
    selectedProject,
    isFeatureEnabled,
    scope,
    telemetryService,
  }), [queryClient, dataService, currentUser, selectedProject, isFeatureEnabled, scope, telemetryService]);

  // ── 2. Deferred context update via useEffect ──────────────────────────
  // CRITICAL: router.update() must NOT run during render.
  // RouterProvider with a context prop calls router.update() synchronously
  // during render. When async loaders keep the router in "pending" state,
  // this creates an infinite synchronous re-render loop:
  //   render → router.update() → store notify → re-render → ...
  // Moving to useEffect breaks this cycle — updates happen after commit.
  React.useEffect(() => {
    if (!router) {
      return;
    }

    React.startTransition(() => {
      router.update({
        ...router.options,
        context: routerContext,
      });
    });
  }, [router, routerContext]);

  if (!router) {
    return <RouteSuspenseFallback />;
  }

  // ── 3. NO context prop — prevents RouterContextProvider from calling
  //       router.update() synchronously during render ──────────────────
  return (
    <RouterProvider
      router={router}
    />
  );
};

export const TanStackAppRouterProvider = TanStackPilotRouter;
