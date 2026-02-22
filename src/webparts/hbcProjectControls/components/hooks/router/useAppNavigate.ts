import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';

export interface IAppNavigateOptions {
  replace?: boolean;
}

export type AppNavigate = (to: string | number, options?: IAppNavigateOptions) => void;

/**
 * Ref-stable navigate function. Consumer-facing API unchanged from pre-Phase 3.
 * Now consumes TanStack Router's useNavigate directly — no RouterAdapterContext.
 *
 * NOTE: No startTransition wrapper — TanStack Router's Transitioner handles transitions
 * natively. Double-wrapping causes React concurrent scheduler deadlock with
 * useSyncExternalStore (router.__store).
 */
export function useAppNavigate(): AppNavigate {
  const tanStackNavigate = useNavigate();
  const ref = React.useRef(tanStackNavigate);
  ref.current = tanStackNavigate;

  return React.useCallback<AppNavigate>(
    (to, options) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      void ref.current({ to, replace: options?.replace });
    },
    [],
  );
}
