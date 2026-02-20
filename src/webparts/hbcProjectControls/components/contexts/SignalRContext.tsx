import * as React from 'react';
import { useAppContext } from './AppContext';
import {
  signalRService,
  cacheService,
  SignalRConnectionStatus,
  IEntityChangedMessage,
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
  const { isFeatureEnabled, activeProjectCode } = useAppContext();
  const isEnabled = isFeatureEnabled('RealTimeUpdates');
  const [connectionStatus, setConnectionStatus] = React.useState<SignalRConnectionStatus>(
    signalRService.status
  );

  // Track previous project for group management
  const prevProjectRef = React.useRef<string | null>(null);
  const joinProjectGroup = React.useCallback((projectCode: string): void => {
    signalRService.joinGroup(`project:${projectCode.toLowerCase()}`);
  }, []);
  const leaveProjectGroup = React.useCallback((projectCode: string): void => {
    signalRService.leaveGroup(`project:${projectCode.toLowerCase()}`);
  }, []);

  // Listen to status changes
  React.useEffect(() => {
    const unsubscribe = signalRService.onStatusChange(setConnectionStatus);
    return unsubscribe;
  }, []);

  // Connect/disconnect based on feature flag
  React.useEffect(() => {
    if (isEnabled) {
      signalRService.connect();
    } else {
      signalRService.disconnect();
    }
  }, [isEnabled]);

  // Auto-join/leave project group when active project code changes
  React.useEffect(() => {
    if (!isEnabled || connectionStatus !== 'connected') return;
    if (!activeProjectCode) return;

    const prevCode = prevProjectRef.current;
    const newCode = activeProjectCode;

    if (prevCode === newCode) return;

    if (prevCode) {
      leaveProjectGroup(prevCode);
    }
    joinProjectGroup(newCode);

    prevProjectRef.current = newCode;
  }, [isEnabled, connectionStatus, activeProjectCode, joinProjectGroup, leaveProjectGroup]);

  // Cache invalidation: clear stale cache when entity changes arrive
  React.useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = signalRService.subscribe('EntityChanged', (msg: SignalRMessage) => {
      if (msg.type !== 'EntityChanged') return;
      const entityMsg = msg as IEntityChangedMessage;
      const keysToInvalidate = entityTypeToCacheKeys(entityMsg.entityType, entityMsg.projectCode);
      keysToInvalidate.forEach(key => cacheService.removeByPrefix(key));
    });

    return unsubscribe;
  }, [isEnabled]);

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
      signalRService.broadcastChange(message).catch(console.warn);
    },
    []
  );

  const value = React.useMemo<ISignalRContextValue>(
    () => ({ connectionStatus, isEnabled, subscribe, broadcastChange }),
    [connectionStatus, isEnabled, subscribe, broadcastChange]
  );

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
};
