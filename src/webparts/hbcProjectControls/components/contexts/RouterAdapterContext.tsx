import * as React from 'react';

export interface IAppNavigateOptions {
  replace?: boolean;
}

export interface IRouterAdapterValue {
  navigate: (to: string | number, options?: IAppNavigateOptions) => void;
  pathname: string;
  search: string;
  params: Record<string, string | undefined>;
}

const RouterAdapterContext = React.createContext<IRouterAdapterValue | undefined>(undefined);

interface IRouterAdapterProviderProps {
  value: IRouterAdapterValue;
  children: React.ReactNode;
}

export const RouterAdapterProvider: React.FC<IRouterAdapterProviderProps> = ({ value, children }) => {
  return <RouterAdapterContext.Provider value={value}>{children}</RouterAdapterContext.Provider>;
};

export const useRouterAdapter = (): IRouterAdapterValue => {
  const context = React.useContext(RouterAdapterContext);
  if (!context) {
    throw new Error('useRouterAdapter must be used within RouterAdapterProvider');
  }
  return context;
};
