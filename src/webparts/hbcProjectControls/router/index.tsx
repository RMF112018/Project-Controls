import * as React from 'react';
import { RouterAdapterProvider } from '../components/contexts/RouterAdapterContext';
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

export const MemoryRouter: React.FC<{ initialEntries?: string[]; children: React.ReactNode }> = ({ initialEntries, children }) => {
  const initial = initialEntries?.[0] ?? '/';
  const initialUrl = React.useMemo(() => new URL(initial, 'http://localhost'), [initial]);
  const [pathname, setPathname] = React.useState(initialUrl.pathname);
  const [search, setSearch] = React.useState(initialUrl.search);

  const value = React.useMemo(() => ({
    navigate: (to: string | number) => {
      if (typeof to === 'number') return;
      const parsed = new URL(to, 'http://localhost');
      setPathname(parsed.pathname);
      setSearch(parsed.search);
    },
    pathname,
    search,
    params: {} as Record<string, string | undefined>,
  }), [pathname, search]);

  return <RouterAdapterProvider value={value}>{children}</RouterAdapterProvider>;
};
