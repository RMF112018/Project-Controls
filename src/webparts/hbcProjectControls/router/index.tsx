import * as React from 'react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router';
import { useAppNavigate } from '../components/hooks/router/useAppNavigate';
import { useAppLocation } from '../components/hooks/router/useAppLocation';
import { useAppParams } from '../components/hooks/router/useAppParams';

export interface INavigateOptions {
  replace?: boolean;
}

export function useNavigate(): (to: string | number, options?: INavigateOptions) => void {
  return useAppNavigate();
}

export function useLocation(): { pathname: string; search: string } {
  return useAppLocation();
}

export function useParams<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(): TParams {
  return useAppParams<TParams>();
}

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);
  return null;
};

/**
 * Context to pass test children into the TanStack Router root route component.
 * Used only by MemoryRouter (test utility).
 */
const TestChildrenContext = React.createContext<React.ReactNode>(null);

const TestRootComponent: React.FC = () => {
  const children = React.useContext(TestChildrenContext);
  return <>{children}</>;
};

/**
 * Test-only MemoryRouter. Creates a real TanStack Router with memory history
 * so that useAppNavigate, useAppLocation, useAppParams all work in tests.
 * Replaces the old RouterAdapterProvider-based MemoryRouter.
 */
export const MemoryRouter: React.FC<{ initialEntries?: string[]; children: React.ReactNode }> = ({ initialEntries, children }) => {
  const initial = initialEntries?.[0] ?? '/';

  const router = React.useMemo(() => {
    const rootRoute = createRootRoute({ component: TestRootComponent });
    const catchAllRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/$',
    });
    return createRouter({
      routeTree: rootRoute.addChildren([catchAllRoute]),
      history: createMemoryHistory({ initialEntries: [initial] }),
    });
  }, [initial]);

  return (
    <TestChildrenContext.Provider value={children}>
      <RouterProvider router={router} />
    </TestChildrenContext.Provider>
  );
};
