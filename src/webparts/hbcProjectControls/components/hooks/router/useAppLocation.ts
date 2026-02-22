import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';

export interface IAppLocation {
  pathname: string;
  search: string;
}

/**
 * Stable location object. Uses useRouterState selector to avoid subscribing
 * to unrelated router state changes (e.g. matches).
 * Consumer-facing API unchanged from pre-Phase 3.
 */
export function useAppLocation(): IAppLocation {
  const { pathname, searchStr } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr ?? '',
    }),
  });

  return React.useMemo(
    () => ({ pathname, search: searchStr }),
    [pathname, searchStr],
  );
}
