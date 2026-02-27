import * as React from 'react';
import {
  IDataService,
  ICurrentUser,
  IFeatureFlag,
  IDashboardPreference,
  ISelectedProject,
  IResolvedPermissions,
  detectSiteContext,
  DEFAULT_HUB_SITE_URL,
  performanceService,
  AuditAction,
  EntityType,
} from '@hbc/sp-services';
import type { ITelemetryService } from '@hbc/sp-services';
import { MockTelemetryService } from '@hbc/sp-services';
import type { IDevToolsConfig } from '../App';
import { useFullScreen } from '../hooks/useFullScreen';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export type { IDashboardPreference, ISelectedProject, ProjectHealthStatus } from '@hbc/sp-services';

export interface IAppContextValue {
  dataService: IDataService;
  telemetryService: ITelemetryService;
  currentUser: ICurrentUser | null;
  featureFlags: IFeatureFlag[];
  isLoading: boolean;
  error: string | null;
  selectedProject: ISelectedProject | null;
  setSelectedProject: (project: ISelectedProject | null, options?: { skipSwitchingFlag?: boolean }) => void;
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
  isNonLocalhostTelemetryAdminEnabled: boolean;
  setNonLocalhostTelemetryAdminEnabled: (enabled: boolean) => void;
  isTelemetryExceptionCaptureEnabled: boolean;
  devToolsConfig?: IDevToolsConfig;
}

const AppContext = React.createContext<IAppContextValue | undefined>(undefined);

interface IAppProviderProps {
  dataService: IDataService;
  telemetryService?: ITelemetryService;
  siteUrl?: string;
  dataServiceMode?: 'mock' | 'standalone' | 'sharepoint';
  devToolsConfig?: IDevToolsConfig;
  children: React.ReactNode;
}

const NON_LOCALHOST_TELEMETRY_ADMIN_TOGGLE_KEY = 'hbc:telemetry:nonlocalhost:enabled';

interface ITelemetryStreamItem {
  kind: 'event' | 'metric' | 'exception' | 'pageView';
  name: string;
  timestamp: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

interface ITelemetryDashboardSinkCapable {
  setDashboardSink?: (sink?: (item: ITelemetryStreamItem) => void) => void;
}

function isLocalhostEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname === 'localhost';
}

const TELEMETRY_AUDIT_TRACKED_EVENTS = new Set<string>([
  'route:lazy:load',
  'route:lazy:load:duration',
  'route:lazy:fallback:visible',
  'route:lazy:load:failure',
  'virtualization:state',
  'virtualization:frame:jank',
  'a11y:scan:summary',
  'a11y:responsive:summary',
  'app:init:phase:duration',
  'app:load:completed',
  'react:commit:threshold',
  'table:filter:interaction',
  'ui:error:boundary',
  'chunk:load:error',
  'longtask:jank:summary',
  'telemetry:export:generated',
]);

export const AppProvider: React.FC<IAppProviderProps> = ({ dataService, telemetryService, siteUrl, dataServiceMode, devToolsConfig, children }) => {
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
  const [isNonLocalhostTelemetryAdminEnabled, setIsNonLocalhostTelemetryAdminEnabledState] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(NON_LOCALHOST_TELEMETRY_ADMIN_TOGGLE_KEY) === 'true';
    } catch {
      return false;
    }
  });

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

  // Guard: cannot clear project on project-specific sites
  const switchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSetSelectedProject = React.useCallback((project: ISelectedProject | null, options?: { skipSwitchingFlag?: boolean }) => {
    if (isProjectSite && project === null) return;
    setSelectedProject(project);
    if (project && !options?.skipSwitchingFlag) {
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
      const emitPhaseDuration = (phaseMarkName: string): void => {
        const phaseMark = performanceService.getMark(phaseMarkName);
        if (phaseMark?.duration === undefined) {
          return;
        }
        const properties = {
          phase: phaseMarkName,
          isProjectSite: String(isProjectSite),
        };
        resolvedTelemetry.trackMetric('app:init:phase:duration', phaseMark.duration, properties);
        resolvedTelemetry.trackEvent({
          name: 'app:init:phase:duration',
          properties,
          measurements: {
            durationMs: phaseMark.duration,
          },
        });
      };

      performanceService.startMark('app:contextInit');
      try {
        setIsLoading(true);
        performanceService.startMark('app:userFlagsFetch');
        const [user, rawFlags] = await Promise.all([
          dataService.getCurrentUser(),
          dataService.getFeatureFlags(),
        ]);
        const flags = rawFlags;
        performanceService.endMark('app:userFlagsFetch');
        emitPhaseDuration('app:userFlagsFetch');

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
          emitPhaseDuration('app:permissionResolve');
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
          emitPhaseDuration('app:projectAutoSelect');
        }

        performanceService.endMark('app:contextInit');
        emitPhaseDuration('app:contextInit');

        if (typeof window !== 'undefined') {
          (window as Window & { __hbcPerformanceMarks__?: unknown }).__hbcPerformanceMarks__ = performanceService.getAllMarks();
        }

        // Fire-and-forget performance log
        const routePath = typeof window !== 'undefined'
          ? (window.location.hash.replace(/^#/, '') || '/')
          : '/';
        const contextInitMark = performanceService.getMark('app:contextInit');
        const userFlagsMark = performanceService.getMark('app:userFlagsFetch');
        const webpartMark = performanceService.getMark('webpart:onInit');
        const appLoadProperties = {
          route: routePath,
          isProjectSite: String(isProjectSite),
          projectCode: siteContext.projectCode ?? '',
        };
        resolvedTelemetry.trackEvent({
          name: 'app:load:completed',
          properties: appLoadProperties,
          measurements: {
            webPartLoadMs: webpartMark?.duration ?? 0,
            appInitMs: contextInitMark?.duration ?? 0,
            dataFetchMs: userFlagsMark?.duration ?? 0,
            totalLoadMs: contextInitMark?.duration ?? 0,
          },
        });

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
  }, [dataService, isProjectSite, siteContext, resolvedTelemetry, siteUrl]);

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

  React.useEffect(() => {
    const lastPersistedByKey = new Map<string, number>();
    const throttleMs = 10_000;

    const sink = (item: ITelemetryStreamItem): void => {
      if (!TELEMETRY_AUDIT_TRACKED_EVENTS.has(item.name)) {
        return;
      }

      const routeKey = item.properties?.route ?? item.properties?.toPath ?? '';
      const throttleKey = `${item.name}:${routeKey}`;
      const now = Date.now();
      const prev = lastPersistedByKey.get(throttleKey) ?? 0;
      if (now - prev < throttleMs) {
        return;
      }
      lastPersistedByKey.set(throttleKey, now);

      dataService.logAudit({
        Action: AuditAction.Telemetry_QueryExecuted,
        EntityType: EntityType.Telemetry,
        EntityId: item.name,
        User: currentUser?.email || 'system',
        Details: JSON.stringify(item),
      }).catch(() => {
        // Telemetry persistence must never block UI flow.
      });
    };

    const telemetryWithSink = resolvedTelemetry as ITelemetryService & ITelemetryDashboardSinkCapable;
    telemetryWithSink.setDashboardSink?.(sink);
    return () => {
      telemetryWithSink.setDashboardSink?.(undefined);
    };
  }, [dataService, resolvedTelemetry, currentUser?.email]);

  // Route project-scoped data service queries to project site when selected
  React.useEffect(() => {
    if (selectedProject?.siteUrl) {
      dataService.setProjectSiteUrl(selectedProject.siteUrl);
    } else if (!selectedProject) {
      dataService.setProjectSiteUrl(null);
    }
  }, [selectedProject, dataService]);

  // Re-resolve permissions when selectedProject changes (if engine is enabled)
  // Debounced to prevent third AppContext cascade during project switch
  const permResolveTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  React.useEffect(() => {
    if (!currentUser || !isPermissionEngineEnabled(featureFlags)) return;

    // Debounce: wait for project switch to settle before re-resolving
    clearTimeout(permResolveTimerRef.current);
    permResolveTimerRef.current = setTimeout(() => {
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
    }, 300);

    return () => clearTimeout(permResolveTimerRef.current);
  }, [selectedProject?.projectCode, currentUser?.email, dataService, featureFlags, isPermissionEngineEnabled]);

  // Stage 3 (sub-task 3): In mock/dev mode, bypass granular permission checks
  // so all UI remains accessible during development. Production uses real sets.
  const devModeFullAccess = dataServiceMode === 'mock';

  const hasPermission = React.useCallback((permission: string): boolean => {
    if (!currentUser) return false;
    if (devModeFullAccess) return true;
    return currentUser.permissions.has(permission);
  }, [currentUser, devModeFullAccess]);

  // Use roles array ref (stable across permission-only updates) instead of
  // currentUser object ref to prevent identity cascade through routerProps →
  // RouterProvider → entire route tree on permission re-resolution.
  const userRoles = currentUser?.roles;
  const isFeatureEnabled = React.useCallback((featureName: string): boolean => {
    const flag = featureFlags.find(f => f.FeatureName === featureName);
    if (!flag) return false;
    if (!flag.Enabled) return false;
    if (flag.EnabledForRoles && flag.EnabledForRoles.length > 0 && userRoles) {
      return flag.EnabledForRoles.some(role => userRoles.includes(role));
    }
    return true;
  }, [featureFlags, userRoles]);

  const setNonLocalhostTelemetryAdminEnabled = React.useCallback((enabled: boolean): void => {
    setIsNonLocalhostTelemetryAdminEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(NON_LOCALHOST_TELEMETRY_ADMIN_TOGGLE_KEY, String(enabled));
      } catch {
        // best-effort persistence
      }
    }
  }, []);

  const isTelemetryExceptionCaptureEnabled = React.useMemo(() => {
    if (isLocalhostEnvironment()) {
      return true;
    }
    return isFeatureEnabled('NonLocalhostTelemetry') && isNonLocalhostTelemetryAdminEnabled;
  }, [isFeatureEnabled, isNonLocalhostTelemetryAdminEnabled]);

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
    isNonLocalhostTelemetryAdminEnabled,
    setNonLocalhostTelemetryAdminEnabled,
    isTelemetryExceptionCaptureEnabled,
    devToolsConfig,
  }), [dataService, resolvedTelemetry, currentUser, featureFlags, isLoading, error, selectedProject, handleSetSelectedProject, hasPermission, isFeatureEnabled, resolvedPermissions, isProjectSite, isProjectSwitching, isFullScreen, toggleFullScreen, exitFullScreen, dataServiceMode, isOnline, dashboardPreferences, getDashboardPreference, setDashboardPreference, resetDashboardPreference, isNonLocalhostTelemetryAdminEnabled, setNonLocalhostTelemetryAdminEnabled, isTelemetryExceptionCaptureEnabled, devToolsConfig]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContextValue => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
