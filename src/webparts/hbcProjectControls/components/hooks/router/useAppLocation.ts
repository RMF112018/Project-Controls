import { useRouterAdapter } from '../../contexts/RouterAdapterContext';

export interface IAppLocation {
  pathname: string;
}

export function useAppLocation(): IAppLocation {
  const { pathname } = useRouterAdapter();
  return { pathname };
}
