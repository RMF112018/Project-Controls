import * as React from 'react';
import { IDataService } from '../../services/IDataService';
import { ICurrentUser, IFeatureFlag, Stage } from '../../models';
import { IResolvedPermissions } from '../../models/IPermissionTemplate';
import { detectSiteContext } from '../../utils/siteDetector';
import { DEFAULT_HUB_SITE_URL } from '../../utils/constants';

export interface ISelectedProject {
  projectCode: string;
  projectName: string;
  stage: Stage;
  region?: string;
  division?: string;
  leadId?: number;
  siteUrl?: string;  // Project SP site URL (set on project sites, optional on hub selection)
}

export interface IAppContextValue {
  dataService: IDataService;
  currentUser: ICurrentUser | null;
  featureFlags: IFeatureFlag[];
  isLoading: boolean;
  error: string | null;
  selectedProject: ISelectedProject | null;
  setSelectedProject: (project: ISelectedProject | null) => void;
  hasPermission: (permission: string) => boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  resolvedPermissions: IResolvedPermissions | null;
  isProjectSite: boolean;
}

const AppContext = React.createContext<IAppContextValue | undefined>(undefined);

interface IAppProviderProps {
  dataService: IDataService;
  siteUrl?: string;
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ dataService, siteUrl, children }) => {
  const [currentUser, setCurrentUser] = React.useState<ICurrentUser | null>(null);
  const [featureFlags, setFeatureFlags] = React.useState<IFeatureFlag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<ISelectedProject | null>(null);
  const [resolvedPermissions, setResolvedPermissions] = React.useState<IResolvedPermissions | null>(null);

  // Site detection — compute once on mount
  const siteContext = React.useMemo(() => {
    if (!siteUrl) {
      return { siteUrl: DEFAULT_HUB_SITE_URL, hubSiteUrl: DEFAULT_HUB_SITE_URL, isHubSite: true };
    }
    return detectSiteContext(siteUrl, DEFAULT_HUB_SITE_URL);
  }, [siteUrl]);

  const isProjectSite = !siteContext.isHubSite && !!siteContext.projectCode;

  // Guard: cannot clear project on project-specific sites
  const handleSetSelectedProject = React.useCallback((project: ISelectedProject | null) => {
    if (isProjectSite && project === null) return;
    setSelectedProject(project);
  }, [isProjectSite]);

  // Helper: check if PermissionEngine flag is enabled in a given set of flags
  const isPermissionEngineEnabled = React.useCallback((flags: IFeatureFlag[]): boolean => {
    const flag = flags.find(f => f.FeatureName === 'PermissionEngine');
    return flag?.Enabled === true;
  }, []);

  React.useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [user, flags] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getFeatureFlags(),
        ]);

        // If PermissionEngine flag is enabled, resolve permissions via the engine
        const engineEnabled = flags.find(f => f.FeatureName === 'PermissionEngine')?.Enabled === true;
        if (engineEnabled) {
          try {
            const resolved = await dataService.resolveUserPermissions(user.email, null);
            user.permissions = resolved.permissions;
            setResolvedPermissions(resolved);
          } catch {
            // Fallback: keep ROLE_PERMISSIONS-based permissions (already set by getCurrentUser)
            console.warn('Permission engine resolution failed, using role-based fallback');
          }
        }

        setCurrentUser(user);
        setFeatureFlags(flags);

        // Auto-select project on project-specific sites
        if (isProjectSite && siteContext.projectCode) {
          try {
            const results = await dataService.searchLeads(siteContext.projectCode);
            const lead = results.find(l => l.ProjectCode === siteContext.projectCode);
            if (lead) {
              setSelectedProject({
                projectCode: lead.ProjectCode!,
                projectName: lead.Title,
                stage: lead.Stage,
                region: lead.Region,
                division: lead.Division,
                leadId: lead.id,
                siteUrl: siteContext.siteUrl,
              });
            }
          } catch {
            console.warn('Auto-select failed for project code:', siteContext.projectCode);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };
    init().catch(console.error);
  }, [dataService, isProjectSite, siteContext]);

  // Route project-scoped data service queries to project site when selected
  React.useEffect(() => {
    if (selectedProject?.siteUrl) {
      dataService.setProjectSiteUrl(selectedProject.siteUrl);
    } else if (!selectedProject) {
      dataService.setProjectSiteUrl(null);
    }
  }, [selectedProject, dataService]);

  // Re-resolve permissions when selectedProject changes (if engine is enabled)
  React.useEffect(() => {
    if (!currentUser || !isPermissionEngineEnabled(featureFlags)) return;

    const projectCode = selectedProject?.projectCode || null;
    dataService.resolveUserPermissions(currentUser.email, projectCode)
      .then(resolved => {
        setCurrentUser(prev => {
          if (!prev) return prev;
          return { ...prev, permissions: resolved.permissions };
        });
        setResolvedPermissions(resolved);
      })
      .catch(() => {
        // Keep existing permissions on failure
        console.warn('Permission re-resolution failed for project change');
      });
  }, [selectedProject, currentUser?.email, dataService, featureFlags, isPermissionEngineEnabled]);

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
    isLoading,
    error,
    selectedProject,
    setSelectedProject: handleSetSelectedProject,
    hasPermission,
    isFeatureEnabled,
    resolvedPermissions,
    isProjectSite,
  }), [dataService, currentUser, featureFlags, isLoading, error, selectedProject, handleSetSelectedProject, hasPermission, isFeatureEnabled, resolvedPermissions, isProjectSite]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
