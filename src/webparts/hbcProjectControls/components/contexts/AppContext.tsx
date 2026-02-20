import * as React from 'react';
import {
  IDataService,
  ICurrentUser,
  IFeatureFlag,
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

export interface IAppContextValue {
  dataService: IDataService;
  telemetryService: ITelemetryService;
  currentUser: ICurrentUser | null;
  featureFlags: IFeatureFlag[];
  isLoading: boolean;
  error: string | null;
  activeProjectCode: string | null;
  hasPermission: (permission: string) => boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  resolvedPermissions: IResolvedPermissions | null;
  isProjectSite: boolean;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  exitFullScreen: () => void;
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
  const [activeProjectCode, setActiveProjectCode] = React.useState<string | null>(null);
  const [resolvedPermissions, setResolvedPermissions] = React.useState<IResolvedPermissions | null>(null);
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

  const extractProjectCodeFromHash = React.useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace(/^#/, '');
    const pathname = hash.startsWith('/') ? hash : `/${hash}`;
    if (!pathname.startsWith('/operations/')) return null;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 3) return null;
    const legacySegments = new Set([
      'project',
      'compliance-log',
      'project-settings',
      'startup-checklist',
      'management-plan',
      'superintendent-plan',
      'closeout-checklist',
      'buyout-log',
      'contract-tracking',
      'risk-cost',
      'schedule',
      'quality-concerns',
      'safety-concerns',
      'monthly-review',
      'constraints-log',
      'permits-log',
      'responsibility',
      'project-record',
      'lessons-learned',
      'readicheck',
      'best-practices',
      'sub-scorecard',
      'gonogo',
    ]);
    const candidate = segments[1];
    if (!candidate || legacySegments.has(candidate)) return null;
    return decodeURIComponent(candidate);
  }, []);

  // Helper: check if PermissionEngine flag is enabled in a given set of flags
  const isPermissionEngineEnabled = React.useCallback((flags: IFeatureFlag[]): boolean => {
    const flag = flags.find(f => f.FeatureName === 'PermissionEngine');
    return flag?.Enabled === true;
  }, []);

  React.useEffect(() => {
    if (dataServiceMode === 'sharepoint') return;
    performanceService.initialize((entry) => dataService.logPerformanceEntry(entry));
  }, [dataService, dataServiceMode]);

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

        // Auto-select project code on project-specific sites
        if (isProjectSite && siteContext.projectCode) {
          setActiveProjectCode(siteContext.projectCode);
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
    if (isProjectSite && siteContext.projectCode) {
      setActiveProjectCode(siteContext.projectCode);
      return;
    }

    const syncFromLocation = (): void => {
      setActiveProjectCode(extractProjectCodeFromHash());
    };
    syncFromLocation();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', syncFromLocation);
      window.addEventListener('popstate', syncFromLocation);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', syncFromLocation);
        window.removeEventListener('popstate', syncFromLocation);
      }
    };
  }, [extractProjectCodeFromHash, isProjectSite, siteContext.projectCode]);

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

  // Route project-scoped data service queries to project site when running inside a project site.
  React.useEffect(() => {
    if (isProjectSite) {
      dataService.setProjectSiteUrl(siteContext.siteUrl);
    } else {
      dataService.setProjectSiteUrl(null);
    }
  }, [dataService, isProjectSite, siteContext.siteUrl]);

  // Re-resolve permissions when active project code changes (if engine is enabled)
  React.useEffect(() => {
    if (!currentUser || !isPermissionEngineEnabled(featureFlags)) return;

    dataService.resolveUserPermissions(currentUser.email, activeProjectCode)
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
  }, [activeProjectCode, currentUser?.email, dataService, featureFlags, isPermissionEngineEnabled]);

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

  const stableActiveProjectCode = React.useMemo(() => activeProjectCode, [activeProjectCode]);

  const value: IAppContextValue = React.useMemo(() => ({
    dataService,
    telemetryService: resolvedTelemetry,
    currentUser,
    featureFlags,
    isLoading,
    error,
    activeProjectCode: stableActiveProjectCode,
    hasPermission,
    isFeatureEnabled,
    resolvedPermissions,
    isProjectSite,
    isFullScreen,
    toggleFullScreen,
    exitFullScreen,
    dataServiceMode: dataServiceMode ?? 'mock',
    isOnline,
    dashboardPreferences,
    getDashboardPreference,
    setDashboardPreference,
    resetDashboardPreference,
  }), [dataService, resolvedTelemetry, currentUser, featureFlags, isLoading, error, stableActiveProjectCode, hasPermission, isFeatureEnabled, resolvedPermissions, isProjectSite, isFullScreen, toggleFullScreen, exitFullScreen, dataServiceMode, isOnline, dashboardPreferences, getDashboardPreference, setDashboardPreference, resetDashboardPreference]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
