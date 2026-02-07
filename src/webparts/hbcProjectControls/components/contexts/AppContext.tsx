import * as React from 'react';
import { IDataService } from '../../services/IDataService';
import { ICurrentUser, IFeatureFlag, RenderMode } from '../../models';
import { ISiteContext, getMockSiteContext } from '../../utils/siteDetector';

export interface IAppContextValue {
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  featureFlags: IFeatureFlag[];
  renderMode: RenderMode;
  isLoading: boolean;
  error: string | null;
  siteContext: ISiteContext;
  hasPermission: (permission: string) => boolean;
  isFeatureEnabled: (featureName: string) => boolean;
}

const AppContext = React.createContext<IAppContextValue | undefined>(undefined);

interface IAppProviderProps {
  dataService: IDataService;
  renderMode: RenderMode;
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ dataService, renderMode, children }) => {
  const [currentUser, setCurrentUser] = React.useState<ICurrentUser | null>(null);
  const [featureFlags, setFeatureFlags] = React.useState<IFeatureFlag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const siteContext = React.useMemo(() => getMockSiteContext(renderMode), [renderMode]);

  React.useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [user, flags] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getFeatureFlags(),
        ]);
        setCurrentUser(user);
        setFeatureFlags(flags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };
    init().catch(console.error);
  }, [dataService]);

  const hasPermission = React.useCallback((permission: string): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions.has(permission);
  }, [currentUser]);

  const isFeatureEnabled = React.useCallback((featureName: string): boolean => {
    const flag = featureFlags.find(f => f.FeatureName === featureName);
    if (!flag) return false;
    if (!flag.Enabled) return false;
    if (flag.EnabledForRoles && flag.EnabledForRoles.length > 0 && currentUser) {
      return flag.EnabledForRoles.some(role => currentUser.roles.includes(role));
    }
    return true;
  }, [featureFlags, currentUser]);

  const value: IAppContextValue = React.useMemo(() => ({
    dataService,
    currentUser,
    featureFlags,
    renderMode,
    isLoading,
    error,
    siteContext,
    hasPermission,
    isFeatureEnabled,
  }), [dataService, currentUser, featureFlags, renderMode, isLoading, error, siteContext, hasPermission, isFeatureEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
