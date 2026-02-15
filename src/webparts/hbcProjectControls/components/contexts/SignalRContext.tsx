import * as React from 'react';
import { useAppContext } from './AppContext';
import {
  signalRService,
  SignalRConnectionStatus,
  IEntityChangedMessage,
  IWorkflowAdvancedMessage,
  SignalRMessage,
} from '@hbc/sp-services';

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
  const { isFeatureEnabled, selectedProject } = useAppContext();
  const isEnabled = isFeatureEnabled('RealTimeUpdates');
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

  // Connect/disconnect based on feature flag
  React.useEffect(() => {
    if (isEnabled) {
      signalRService.connect();
    } else {
      signalRService.disconnect();
    }
  }, [isEnabled]);

  // Auto-join/leave project group when selectedProject changes
  React.useEffect(() => {
    if (!isEnabled || connectionStatus !== 'connected') return;

    const prevCode = prevProjectRef.current;
    const newCode = selectedProject?.projectCode || null;

    if (prevCode === newCode) return;

    if (prevCode) {
      signalRService.leaveGroup(`project:${prevCode.toLowerCase()}`);
    }
    if (newCode) {
      signalRService.joinGroup(`project:${newCode.toLowerCase()}`);
    }

    prevProjectRef.current = newCode;
  }, [isEnabled, connectionStatus, selectedProject]);

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
