import * as React from 'react';
import { useRouterAdapter } from '../../contexts/RouterAdapterContext';
import type { IAppNavigateOptions } from '../../contexts/RouterAdapterContext';

export type AppNavigate = (to: string | number, options?: IAppNavigateOptions) => void;

export function useAppNavigate(): AppNavigate {
  const { navigate } = useRouterAdapter();
  // Ref always holds latest adapter navigate; callback identity never changes.
  const ref = React.useRef(navigate);
  ref.current = navigate;
  return React.useCallback<AppNavigate>(
    (to, options) => ref.current(to, options),
    [],
  );
}
