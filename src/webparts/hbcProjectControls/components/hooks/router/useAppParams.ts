import * as React from 'react';
import { useRouterAdapter } from '../../contexts/RouterAdapterContext';

export function useAppParams<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(): TParams {
  const { params } = useRouterAdapter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => params as TParams, [JSON.stringify(params)]);
}
