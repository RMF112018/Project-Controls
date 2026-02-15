import * as React from 'react';
import { HBC_COLORS, SPACING } from '../../theme/tokens';
import { IProvisioningLog, ProvisioningStatus as ProvStatus, PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, EntityType } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from '../hooks/useSignalR';
import { LoadingSpinner } from './LoadingSpinner';

export interface IProvisioningStatusProps {
  projectCode: string;
  /** If provided, skip polling and use this log directly */
  log?: IProvisioningLog;
  /** Poll interval in ms. Default 800ms. Set to 0 to disable polling. */
  pollInterval?: number;
  /** Compact mode for inline display */
  compact?: boolean;
}

const POLL_INTERVAL_SIGNALR = 5000; // 5 seconds backup when SignalR connected

function getStatusColor(status: ProvStatus): string {
  switch (status) {
    case ProvStatus.Completed: return HBC_COLORS.success;
    case ProvStatus.InProgress: return HBC_COLORS.info;
    case ProvStatus.Queued: return HBC_COLORS.gray400;
    case ProvStatus.PartialFailure:
    case ProvStatus.Failed: return HBC_COLORS.error;
    default: return HBC_COLORS.gray400;
  }
}

function getStatusLabel(status: ProvStatus): string {
  switch (status) {
    case ProvStatus.Completed: return 'Completed';
    case ProvStatus.InProgress: return 'In Progress';
    case ProvStatus.Queued: return 'Queued';
    case ProvStatus.PartialFailure: return 'Partial Failure';
    case ProvStatus.Failed: return 'Failed';
    default: return 'Unknown';
  }
}

export function ProvisioningStatusView({
  projectCode,
  log: externalLog,
  pollInterval = 800,
  compact = false,
}: IProvisioningStatusProps): React.ReactElement {
  const { dataService } = useAppContext();
  const [log, setLog] = React.useState<IProvisioningLog | null>(externalLog ?? null);
  const [loading, setLoading] = React.useState(!externalLog);

  const fetchStatus = React.useCallback(async () => {
    const result = await dataService.getProvisioningStatus(projectCode);
    setLog(result);
    setLoading(false);
  }, [dataService, projectCode]);

  // SignalR: refresh on Project entity changes — relax polling when connected
  const { isEnabled: signalRConnected } = useSignalR({
    entityType: EntityType.Project,
    projectCode,
    onEntityChanged: React.useCallback(() => { fetchStatus().catch(console.error); }, [fetchStatus]),
  });

  const effectivePollInterval = signalRConnected ? POLL_INTERVAL_SIGNALR : pollInterval;

  React.useEffect(() => {
    if (externalLog) {
      setLog(externalLog);
      return;
    }

    let cancelled = false;

    const doFetch = async (): Promise<void> => {
      const result = await dataService.getProvisioningStatus(projectCode);
      if (!cancelled) {
        setLog(result);
        setLoading(false);
      }
    };

    doFetch().catch(console.error);

    if (effectivePollInterval > 0) {
      const interval = setInterval(() => {
        doFetch().catch(console.error);
      }, effectivePollInterval);

      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => { cancelled = true; };
  }, [projectCode, externalLog, effectivePollInterval, dataService]);

  // Stop polling once completed or failed
  const isTerminal = log?.status === ProvStatus.Completed ||
    log?.status === ProvStatus.Failed ||
    log?.status === ProvStatus.PartialFailure;

  React.useEffect(() => {
    if (isTerminal || !log || externalLog || effectivePollInterval <= 0) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
      const result = await dataService.getProvisioningStatus(projectCode);
      if (!cancelled) setLog(result);
    }, effectivePollInterval);

    return () => { cancelled = true; clearInterval(interval); };
  }, [isTerminal, log, externalLog, effectivePollInterval, projectCode, dataService]);

  if (loading && !log) {
    return <LoadingSpinner label="Loading provisioning status..." />;
  }

  if (!log) {
    return (
      <div style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
        No provisioning record found.
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: compact ? SPACING.md : SPACING.lg,
    background: HBC_COLORS.white,
    borderRadius: '8px',
    border: `1px solid ${HBC_COLORS.gray200}`,
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: HBC_COLORS.white,
    backgroundColor: getStatusColor(log.status),
    marginBottom: compact ? SPACING.sm : SPACING.md,
  };

  return (
    <div style={containerStyle}>
      {!compact && (
        <div style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: SPACING.sm }}>
          Site Provisioning
        </div>
      )}

      <div style={badgeStyle}>{getStatusLabel(log.status)}</div>

      {/* Vertical stepper */}
      <div style={{ marginTop: SPACING.sm }}>
        {PROVISIONING_STEPS.map(({ step, label }) => {
          const isCompleted = log.completedSteps >= step;
          const isCurrent = log.status === ProvStatus.InProgress && log.currentStep === step && !isCompleted;
          const isFailed = log.failedStep === step;

          let dotColor: string = HBC_COLORS.gray300;
          let textColor: string = HBC_COLORS.gray400;
          let lineColor: string = HBC_COLORS.gray200;

          if (isCompleted) {
            dotColor = HBC_COLORS.success;
            textColor = HBC_COLORS.gray700;
            lineColor = HBC_COLORS.success;
          } else if (isCurrent) {
            dotColor = HBC_COLORS.info;
            textColor = HBC_COLORS.navy;
          } else if (isFailed) {
            dotColor = HBC_COLORS.error;
            textColor = HBC_COLORS.error;
          }

          const dotSize = compact ? 16 : 20;
          const fontSize = compact ? '12px' : '13px';

          return (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
              {/* Connector line */}
              {step < TOTAL_PROVISIONING_STEPS && (
                <div style={{
                  position: 'absolute',
                  left: `${dotSize / 2 - 1}px`,
                  top: `${dotSize}px`,
                  width: '2px',
                  height: compact ? '20px' : '24px',
                  backgroundColor: isCompleted ? lineColor : HBC_COLORS.gray200,
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                backgroundColor: dotColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: SPACING.sm,
              }}>
                {isCompleted && (
                  <span style={{ color: HBC_COLORS.white, fontSize: '10px', fontWeight: 700 }}>&#10003;</span>
                )}
                {isCurrent && (
                  <span style={{ color: HBC_COLORS.white, fontSize: '9px', fontWeight: 700 }}>&#9679;</span>
                )}
                {isFailed && (
                  <span style={{ color: HBC_COLORS.white, fontSize: '10px', fontWeight: 700 }}>&#10007;</span>
                )}
              </div>

              {/* Label */}
              <div style={{
                paddingBottom: compact ? '12px' : '16px',
                fontSize,
                color: textColor,
                fontWeight: isCurrent ? 600 : 400,
                lineHeight: `${dotSize}px`,
              }}>
                <span>Step {step}: {label}</span>
                {isFailed && log.errorMessage && (
                  <div style={{
                    fontSize: '11px',
                    color: HBC_COLORS.error,
                    marginTop: '2px',
                  }}>
                    {log.errorMessage}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Site URL link on completion */}
      {log.status === ProvStatus.Completed && log.siteUrl && (
        <div style={{
          marginTop: SPACING.sm,
          padding: SPACING.sm,
          backgroundColor: HBC_COLORS.successLight,
          borderRadius: '6px',
          fontSize: '13px',
        }}>
          <strong>Project site ready: </strong>
          <a
            href={log.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: HBC_COLORS.navy, fontWeight: 600 }}
          >
            {log.siteUrl}
          </a>
        </div>
      )}
    </div>
  );
}
