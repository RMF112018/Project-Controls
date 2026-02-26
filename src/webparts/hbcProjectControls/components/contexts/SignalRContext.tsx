import * as React from 'react';
import { useAppContext } from './AppContext';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import {
  signalRService,
  cacheService,
  SignalRConnectionStatus,
  IEntityChangedMessage,
  IProvisioningStatusMessage,
  SignalRMessage,
  EntityType,
  CACHE_KEYS,
} from '@hbc/sp-services';

/** Maps an EntityType to the cache key patterns that should be invalidated */
function entityTypeToCacheKeys(entityType: EntityType, projectCode?: string): string[] {
  const keys: string[] = [];

  const map: Partial<Record<EntityType, string[]>> = {
    [EntityType.Lead]: [CACHE_KEYS.LEADS],
    [EntityType.Scorecard]: [CACHE_KEYS.SCORECARDS],
    [EntityType.Estimate]: [CACHE_KEYS.ESTIMATES, CACHE_KEYS.KICKOFFS],
    [EntityType.Project]: [
      CACHE_KEYS.PROJECTS,
      CACHE_KEYS.ACTIVE_PROJECTS,
      CACHE_KEYS.PORTFOLIO_SUMMARY,
      CACHE_KEYS.PERSONNEL_WORKLOAD,
      CACHE_KEYS.DATA_MART,
    ],
    [EntityType.Meeting]: [CACHE_KEYS.MEETINGS],
    [EntityType.ProjectRecord]: [CACHE_KEYS.MARKETING_RECORDS],
    [EntityType.Permission]: [CACHE_KEYS.PERMISSIONS],
    [EntityType.PermissionTemplate]: [CACHE_KEYS.TEMPLATES],
    [EntityType.ProjectTeamAssignment]: [
      CACHE_KEYS.PERMISSIONS,
      CACHE_KEYS.ASSIGNMENTS,
      CACHE_KEYS.ACCESSIBLE_PROJECTS,
    ],
    [EntityType.Config]: [CACHE_KEYS.CONFIG, CACHE_KEYS.FEATURE_FLAGS, CACHE_KEYS.SECTORS],
    [EntityType.WorkflowDefinition]: [CACHE_KEYS.WORKFLOWS],
    [EntityType.AssignmentMapping]: [CACHE_KEYS.ASSIGNMENTS],
    [EntityType.Quality]: [CACHE_KEYS.QUALITY],
    [EntityType.Safety]: [CACHE_KEYS.SAFETY],
    [EntityType.RiskCost]: [CACHE_KEYS.RISK_COST, CACHE_KEYS.BUYOUT],
    [EntityType.Schedule]: [CACHE_KEYS.SCHEDULE],
    [EntityType.SuperintendentPlan]: [CACHE_KEYS.SUPER_PLAN],
    [EntityType.LessonLearned]: [CACHE_KEYS.LESSONS],
    [EntityType.PMP]: [CACHE_KEYS.PMP],
    [EntityType.MonthlyReview]: [CACHE_KEYS.MONTHLY_REVIEW],
    [EntityType.Checklist]: [CACHE_KEYS.CHECKLIST],
    [EntityType.Matrix]: [CACHE_KEYS.MATRIX],
    [EntityType.TurnoverAgenda]: [CACHE_KEYS.TURNOVER],
  };

  const baseKeys = map[entityType];
  if (baseKeys) {
    keys.push(...baseKeys);
    // Also invalidate project-scoped cache keys
    if (projectCode) {
      baseKeys.forEach(k => keys.push(`${k}_${projectCode}`));
    }
  }

  return keys;
}

export interface ISignalRContextValue {
  connectionStatus: SignalRConnectionStatus;
  isEnabled: boolean;
  subscribe: (channelKey: string, callback: (msg: SignalRMessage) => void) => () => void;
  broadcastChange: (message: SignalRMessage) => void;
}

const SignalRContext = React.createContext<ISignalRContextValue>({
  connectionStatus: 'disconnected',
  isEnabled: false,
  subscribe: () => () => { /* noop */ },
  broadcastChange: () => { /* noop */ },
});

export const useSignalRContext = (): ISignalRContextValue => React.useContext(SignalRContext);

interface ISignalRProviderProps {
  children: React.ReactNode;
}

export const SignalRProvider: React.FC<ISignalRProviderProps> = ({ children }) => {
  const { selectedProject, telemetryService, isTelemetryExceptionCaptureEnabled } = useAppContext();
  const isEnabled = true;
  const [connectionStatus, setConnectionStatus] = React.useState<SignalRConnectionStatus>(
    signalRService.status
  );

  // Track previous project for group management
  const prevProjectRef = React.useRef<string | null>(null);

  // Listen to status changes
  React.useEffect(() => {
    const unsubscribe = signalRService.onStatusChange(setConnectionStatus);
    return unsubscribe;
  }, []);

  // Stage 12: RealTimeUpdates promoted to permanent behavior.
  React.useEffect(() => {
    const trackSignalRError = (error: unknown, operation: string): void => {
      if (!isTelemetryExceptionCaptureEnabled || !telemetryService.isInitialized()) {
        return;
      }
      const exception = error instanceof Error ? error : new Error(String(error));
      telemetryService.trackException(exception, {
        source: 'SignalRProvider',
        operation,
      });
    };

    Promise.resolve(signalRService.connect()).catch((error) => {
      console.warn('[SignalR] connect failed:', error);
      trackSignalRError(error, 'connect');
    });

    return () => {
      Promise.resolve(signalRService.disconnect()).catch((error) => {
        console.warn('[SignalR] disconnect failed:', error);
        trackSignalRError(error, 'disconnect');
      });
    };
  }, [isEnabled, telemetryService, isTelemetryExceptionCaptureEnabled]);

  // Auto-join/leave project group when selectedProject changes
  React.useEffect(() => {
    if (!isEnabled || connectionStatus !== 'connected') return;

    const prevCode = prevProjectRef.current;
    const newCode = selectedProject?.projectCode || null;

    if (prevCode === newCode) return;

    if (prevCode) {
      Promise.resolve(signalRService.leaveGroup(`project:${prevCode.toLowerCase()}`)).catch((error) => {
        console.warn('[SignalR] leaveGroup failed:', error);
        if (isTelemetryExceptionCaptureEnabled && telemetryService.isInitialized()) {
          const exception = error instanceof Error ? error : new Error(String(error));
          telemetryService.trackException(exception, {
            source: 'SignalRProvider',
            operation: 'leaveGroup',
            projectCode: prevCode,
          });
        }
      });
    }
    if (newCode) {
      Promise.resolve(signalRService.joinGroup(`project:${newCode.toLowerCase()}`)).catch((error) => {
        console.warn('[SignalR] joinGroup failed:', error);
        if (isTelemetryExceptionCaptureEnabled && telemetryService.isInitialized()) {
          const exception = error instanceof Error ? error : new Error(String(error));
          telemetryService.trackException(exception, {
            source: 'SignalRProvider',
            operation: 'joinGroup',
            projectCode: newCode,
          });
        }
      });
    }

    prevProjectRef.current = newCode;
  }, [isEnabled, connectionStatus, selectedProject, telemetryService, isTelemetryExceptionCaptureEnabled]);

  // Cache invalidation: clear stale cache when entity changes arrive
  React.useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = signalRService.subscribe('EntityChanged', (msg: SignalRMessage) => {
      if (msg.type !== 'EntityChanged') return;
      const entityMsg = msg as IEntityChangedMessage;
      try {
        const keysToInvalidate = entityTypeToCacheKeys(entityMsg.entityType, entityMsg.projectCode);
        keysToInvalidate.forEach(key => cacheService.removeByPrefix(key));
      } catch (error) {
        console.warn('[SignalR] entity-change cache invalidation failed:', error);
        if (isTelemetryExceptionCaptureEnabled && telemetryService.isInitialized()) {
          const exception = error instanceof Error ? error : new Error(String(error));
          telemetryService.trackException(exception, {
            source: 'SignalRProvider',
            operation: 'entityChangedCacheInvalidation',
          });
        }
      }
    });

    return unsubscribe;
  }, [isEnabled, telemetryService, isTelemetryExceptionCaptureEnabled]);

  // Phase 5C: Provisioning status cache invalidation
  React.useEffect(() => {
    if (!isEnabled) return;

    const unsubscribeProvisioning = signalRService.subscribe('ProvisioningStatus', (msg: SignalRMessage) => {
      if (msg.type !== 'ProvisioningStatus') return;
      const statusMsg = msg as IProvisioningStatusMessage;
      // Invalidate provisioning cache on step completion or failure
      if (statusMsg.stepStatus === 'completed' || statusMsg.stepStatus === 'failed') {
        try {
          cacheService.removeByPrefix(CACHE_KEYS.PROVISIONING);
        } catch (error) {
          console.warn('[SignalR] provisioning cache invalidation failed:', error);
          if (isTelemetryExceptionCaptureEnabled && telemetryService.isInitialized()) {
            const exception = error instanceof Error ? error : new Error(String(error));
            telemetryService.trackException(exception, {
              source: 'SignalRProvider',
              operation: 'provisioningCacheInvalidation',
            });
          }
        }
      }
    });

    return unsubscribeProvisioning;
  }, [isEnabled, telemetryService, isTelemetryExceptionCaptureEnabled]);

  // Stable subscribe function
  const subscribe = React.useCallback(
    (channelKey: string, callback: (msg: SignalRMessage) => void) => {
      return signalRService.subscribe(channelKey, callback);
    },
    []
  );

  // Fire-and-forget broadcast
  const broadcastChange = React.useCallback(
    (message: SignalRMessage) => {
      signalRService.broadcastChange(message).catch((error) => {
        console.warn(error);
        if (isTelemetryExceptionCaptureEnabled && telemetryService.isInitialized()) {
          const exception = error instanceof Error ? error : new Error(String(error));
          telemetryService.trackException(exception, {
            source: 'SignalRProvider',
            operation: 'broadcastChange',
          });
        }
      });
    },
    [telemetryService, isTelemetryExceptionCaptureEnabled]
  );

  const value = React.useMemo<ISignalRContextValue>(
    () => ({ connectionStatus, isEnabled, subscribe, broadcastChange }),
    [connectionStatus, isEnabled, subscribe, broadcastChange]
  );

  return (
    <ErrorBoundary
      boundaryName="SignalRProvider"
      telemetryService={telemetryService}
      telemetryEnabled={isTelemetryExceptionCaptureEnabled}
    >
      <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
    </ErrorBoundary>
  );
};
