import { useRouterAdapter } from '../../contexts/RouterAdapterContext';

export function useAppParams<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>(): TParams {
  const { params } = useRouterAdapter();
  return params as TParams;
}
