import * as React from 'react';
import {
  IDataService,
  ICurrentUser,
  IFeatureFlag,
  Stage,
  IResolvedPermissions,
  detectSiteContext,
  DEFAULT_HUB_SITE_URL,
  performanceService,
} from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';
import { MockTelemetryService } from '@hbc/sp-services';
import { useFullScreen } from '../hooks/useFullScreen';

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
  telemetryService: ITelemetryService;
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
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  exitFullScreen: () => void;
}

const AppContext = React.createContext<IAppContextValue | undefined>(undefined);

interface IAppProviderProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ dataService, telemetryService, siteUrl, children }) => {
  // Fallback to no-op MockTelemetryService if none provided (dev/test convenience)
  const resolvedTelemetry = React.useMemo<ITelemetryService>(() => {
    if (telemetryService) return telemetryService;
    const mock = new MockTelemetryService();
    mock.initialize('', 'dev', 'Dev');
    return mock;
  }, [telemetryService]);
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
  const { isFullScreen, toggleFullScreen, exitFullScreen } = useFullScreen();

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
      performanceService.startMark('app:contextInit');
      try {
        setIsLoading(true);
        performanceService.startMark('app:userFlagsFetch');
        const [user, flags] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getFeatureFlags(),
        ]);
        performanceService.endMark('app:userFlagsFetch');

        // If PermissionEngine flag is enabled, resolve permissions via the engine
        const engineEnabled = flags.find(f => f.FeatureName === 'PermissionEngine')?.Enabled === true;
        if (engineEnabled) {
          performanceService.startMark('app:permissionResolve');
          try {
            const resolved = await dataService.resolveUserPermissions(user.email, null);
            user.permissions = resolved.permissions;
            setResolvedPermissions(resolved);
          } catch {
            // Fallback: keep ROLE_PERMISSIONS-based permissions (already set by getCurrentUser)
            console.warn('Permission engine resolution failed, using role-based fallback');
          }
          performanceService.endMark('app:permissionResolve');
        }

        setCurrentUser(user);
        setFeatureFlags(flags);

        // Auto-select project on project-specific sites
        if (isProjectSite && siteContext.projectCode) {
          performanceService.startMark('app:projectAutoSelect');
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
          performanceService.endMark('app:projectAutoSelect');
        }

        performanceService.endMark('app:contextInit');

        // Fire-and-forget performance log
        performanceService.logWebPartLoad({
          userEmail: user.email,
          siteUrl: siteUrl || window.location.href,
          projectCode: undefined,
          isProjectSite,
        }).catch(console.warn);
      } catch (err) {
        performanceService.endMark('app:contextInit');
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
    telemetryService: resolvedTelemetry,
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
    isFullScreen,
    toggleFullScreen,
    exitFullScreen,
  }), [dataService, resolvedTelemetry, currentUser, featureFlags, isLoading, error, selectedProject, handleSetSelectedProject, hasPermission, isFeatureEnabled, resolvedPermissions, isProjectSite, isFullScreen, toggleFullScreen, exitFullScreen]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
