import * as React from 'react';
import { offlineQueueService, ConnectivityStatus, SignalRConnectionStatus } from '@hbc/sp-services';
import { useSignalRContext } from '../contexts/SignalRContext';
import { HBC_COLORS } from '../../theme/tokens';

const STATUS_CONFIG: Record<ConnectivityStatus, { color: string; label: string }> = {
  online: { color: HBC_COLORS.success, label: 'Online' },
  offline: { color: HBC_COLORS.error, label: 'Offline' },
  syncing: { color: HBC_COLORS.warning, label: 'Syncing' },
};

const SIGNALR_STATUS_CONFIG: Record<SignalRConnectionStatus, { color: string; label: string }> = {
  connected: { color: HBC_COLORS.success, label: 'Live' },
  connecting: { color: HBC_COLORS.info, label: 'Connecting' },
  reconnecting: { color: HBC_COLORS.warning, label: 'Reconnecting' },
  disconnected: { color: HBC_COLORS.gray400, label: 'Offline' },
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
