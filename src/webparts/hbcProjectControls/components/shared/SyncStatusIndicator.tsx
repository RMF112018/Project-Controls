import * as React from 'react';
import { offlineQueueService, ConnectivityStatus, SignalRConnectionStatus } from '@hbc/sp-services';
import { tokens } from '@fluentui/react-components';
import { useSignalRContext } from '../contexts/SignalRContext';

const STATUS_CONFIG: Record<ConnectivityStatus, { color: string; label: string }> = {
  online: { color: tokens.colorStatusSuccessForeground1, label: 'Online' },
  offline: { color: tokens.colorStatusDangerForeground1, label: 'Offline' },
  syncing: { color: tokens.colorStatusWarningForeground1, label: 'Syncing' },
};

const SIGNALR_STATUS_CONFIG: Record<SignalRConnectionStatus, { color: string; label: string }> = {
  connected: { color: tokens.colorStatusSuccessForeground1, label: 'Live' },
  connecting: { color: tokens.colorBrandForeground1, label: 'Connecting' },
  reconnecting: { color: tokens.colorStatusWarningForeground1, label: 'Reconnecting' },
  disconnected: { color: tokens.colorNeutralForeground3, label: 'Offline' },
};

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = React.useState<ConnectivityStatus>(offlineQueueService.status);
  const { connectionStatus: signalRStatus, isEnabled: signalREnabled } = useSignalRContext();

  React.useEffect(() => {
    const unsubscribe = offlineQueueService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const config = STATUS_CONFIG[status];
  const signalRConfig = SIGNALR_STATUS_CONFIG[signalRStatus];
  const showSignalR = signalREnabled && signalRStatus !== 'connected';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: status === 'online' && !showSignalR ? 'rgba(255,255,255,0.6)' : '#fff',
      }}
      title={
        signalREnabled
          ? `${config.label} | Real-time: ${signalRConfig.label}`
          : config.label
      }
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          animation: status === 'syncing' ? 'pulse 1.5s ease-in-out infinite' : undefined,
        }}
      />
      {status !== 'online' && (
        <span style={{ fontWeight: 500 }}>{config.label}</span>
      )}
      {signalREnabled && (
        <>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: signalRConfig.color,
              display: 'inline-block',
              animation:
                signalRStatus === 'connecting' || signalRStatus === 'reconnecting'
                  ? 'pulse 1.5s ease-in-out infinite'
                  : undefined,
            }}
          />
          {showSignalR && (
            <span style={{ fontWeight: 500 }}>{signalRConfig.label}</span>
          )}
        </>
      )}
    </div>
  );
};
