import * as React from 'react';
import { useRouterAdapter } from '../../contexts/RouterAdapterContext';

export interface IAppLocation {
  pathname: string;
  search: string;
}

export function useAppLocation(): IAppLocation {
  const { pathname, search } = useRouterAdapter();
  return React.useMemo(() => ({ pathname, search }), [pathname, search]);
}
