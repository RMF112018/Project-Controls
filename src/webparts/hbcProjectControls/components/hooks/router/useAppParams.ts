import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';

/**
 * Stable params object. Uses useRouterState selector + JSON.stringify for
 * reference stability. Consumer-facing API unchanged from pre-Phase 3.
 */
export function useAppParams<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(): TParams {
  const paramsJson = useRouterState({
    select: (state) => {
      const lastMatch = state.matches[state.matches.length - 1];
      return JSON.stringify(lastMatch?.params ?? {});
    },
  });

  return React.useMemo(
    () => JSON.parse(paramsJson) as TParams,
    [paramsJson],
  );
}
