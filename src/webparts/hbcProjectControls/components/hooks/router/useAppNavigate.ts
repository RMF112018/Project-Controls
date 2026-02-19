import { useRouterAdapter } from '../../contexts/RouterAdapterContext';
import type { IAppNavigateOptions } from '../../contexts/RouterAdapterContext';

export type AppNavigate = (to: string | number, options?: IAppNavigateOptions) => void;

export function useAppNavigate(): AppNavigate {
  const { navigate } = useRouterAdapter();
  return navigate;
}
