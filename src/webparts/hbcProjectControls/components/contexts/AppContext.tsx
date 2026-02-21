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
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const PROMPT6_FEATURE_FLAGS = [
  'uxDelightMotionV1',
  'uxPersonalizedDashboardsV1',
  'uxChartTableSyncGlowV1',
  'uxInsightsPanelV1',
  'uxToastEnhancementsV1',
] as const;

export interface IDashboardPreference {
  layout?: string[];
  collapsedWidgets?: string[];
  filters?: Record<string, string | number | boolean | string[]>;
  viewMode?: string;
  updatedAt: string;
}

export type ProjectHealthStatus = 'Green' | 'Yellow' | 'Red';

export interface ISelectedProject {
  projectCode: string;
  projectName: string;
  stage: Stage;
  region?: string;
  division?: string;
  leadId?: number;
  siteUrl?: string;  // Project SP site URL (set on project sites, optional on hub selection)
  clientName?: string;
  projectValue?: number;
  overallHealth?: ProjectHealthStatus;
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
  isProjectSwitching: boolean;
  dataServiceMode: 'mock' | 'standalone' | 'sharepoint';
  isOnline: boolean;
  dashboardPreferences: Record<string, IDashboardPreference>;
  getDashboardPreference: (key: string) => IDashboardPreference | undefined;
  setDashboardPreference: (key: string, value: IDashboardPreference) => void;
  resetDashboardPreference: (key: string) => void;
}

const AppContext = React.createContext<IAppContextValue | undefined>(undefined);

interface IAppProviderProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;
  dataServiceMode?: 'mock' | 'standalone' | 'sharepoint';
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ dataService, telemetryService, siteUrl, dataServiceMode, children }) => {
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
  const [isProjectSwitching, setIsProjectSwitching] = React.useState(false);
  const [dashboardPreferences, setDashboardPreferences] = React.useState<Record<string, IDashboardPreference>>({});

  // Site detection — compute once on mount
  const siteContext = React.useMemo(() => {
    if (!siteUrl) {
      return { siteUrl: DEFAULT_HUB_SITE_URL, hubSiteUrl: DEFAULT_HUB_SITE_URL, isHubSite: true };
    }
    return detectSiteContext(siteUrl, DEFAULT_HUB_SITE_URL);
  }, [siteUrl]);

  const isProjectSite = !siteContext.isHubSite && !!siteContext.projectCode;
  const { isFullScreen, toggleFullScreen, exitFullScreen } = useFullScreen();
  const isOnline = useOnlineStatus();
  const dashboardStoragePrefix = React.useMemo(
    () => `hbc:dash-pref:${currentUser?.email ?? 'anonymous'}`,
    [currentUser?.email]
  );

  const getPreferenceStorageKey = React.useCallback((key: string): string => (
    `${dashboardStoragePrefix}:${key}`
  ), [dashboardStoragePrefix]);

  const normalizeFeatureFlags = React.useCallback((flags: IFeatureFlag[]): IFeatureFlag[] => {
    const normalized = [...flags];
    let nextId = normalized.reduce((max, flag) => Math.max(max, flag.id), 0) + 1;
    const existingNames = new Set(normalized.map((flag) => flag.FeatureName));

    for (const featureName of PROMPT6_FEATURE_FLAGS) {
      if (!existingNames.has(featureName)) {
        normalized.push({
          id: nextId++,
          FeatureName: featureName,
          DisplayName: featureName,
          Enabled: false,
          EnabledForRoles: undefined,
          TargetDate: undefined,
          Notes: 'Auto-injected fallback flag for Prompt 6 capability gating',
          Category: 'Infrastructure',
        });
      }
    }

    return normalized;
  }, []);

  // Guard: cannot clear project on project-specific sites
  const switchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSetSelectedProject = React.useCallback((project: ISelectedProject | null) => {
    if (isProjectSite && project === null) return;
    setSelectedProject(project);
    if (project) {
      setIsProjectSwitching(true);
      clearTimeout(switchTimerRef.current);
      // Auto-dismiss after 400ms max — TanStack Query cache usually resolves faster
      switchTimerRef.current = setTimeout(() => setIsProjectSwitching(false), 400);
    }
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
        const [user, rawFlags] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getFeatureFlags(),
        ]);
        const flags = normalizeFeatureFlags(rawFlags);
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

        if (typeof window !== 'undefined') {
          (window as Window & { __hbcPerformanceMarks__?: unknown }).__hbcPerformanceMarks__ = performanceService.getAllMarks();
        }

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
  }, [dataService, isProjectSite, siteContext, normalizeFeatureFlags]);

  React.useEffect(() => {
    if (!currentUser) {
      setDashboardPreferences({});
      return;
    }

    const loaded: Record<string, IDashboardPreference> = {};
    if (typeof window !== 'undefined') {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const storageKey = window.localStorage.key(index);
        if (!storageKey || !storageKey.startsWith(`${dashboardStoragePrefix}:`)) {
          continue;
        }
        const preferenceKey = storageKey.replace(`${dashboardStoragePrefix}:`, '');
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (!raw) {
            continue;
          }
          loaded[preferenceKey] = JSON.parse(raw) as IDashboardPreference;
        } catch {
          // Ignore corrupt preference entry.
        }
      }
    }

    setDashboardPreferences(loaded);
  }, [currentUser, dashboardStoragePrefix]);

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

  const getDashboardPreference = React.useCallback((key: string): IDashboardPreference | undefined => (
    dashboardPreferences[key]
  ), [dashboardPreferences]);

  const setDashboardPreference = React.useCallback((key: string, value: IDashboardPreference): void => {
    setDashboardPreferences((previous) => ({ ...previous, [key]: value }));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(getPreferenceStorageKey(key), JSON.stringify(value));
      } catch {
        // best-effort persistence
      }
    }
  }, [getPreferenceStorageKey]);

  const resetDashboardPreference = React.useCallback((key: string): void => {
    setDashboardPreferences((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(getPreferenceStorageKey(key));
    }
  }, [getPreferenceStorageKey]);

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
    isProjectSwitching,
    isFullScreen,
    toggleFullScreen,
    exitFullScreen,
    dataServiceMode: dataServiceMode ?? 'mock',
    isOnline,
    dashboardPreferences,
    getDashboardPreference,
    setDashboardPreference,
    resetDashboardPreference,
  }), [dataService, resolvedTelemetry, currentUser, featureFlags, isLoading, error, selectedProject, handleSetSelectedProject, hasPermission, isFeatureEnabled, resolvedPermissions, isProjectSite, isProjectSwitching, isFullScreen, toggleFullScreen, exitFullScreen, dataServiceMode, isOnline, dashboardPreferences, getDashboardPreference, setDashboardPreference, resetDashboardPreference]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
