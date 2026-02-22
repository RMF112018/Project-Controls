import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS, SPACING } from '../../../theme/tokens';
import type { IProvisioningSummary } from '@hbc/sp-services';

const statCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: SPACING.md,
  borderRadius: '8px',
  backgroundColor: HBC_COLORS.gray50,
  border: `1px solid ${HBC_COLORS.gray200}`,
  minWidth: '140px',
  flex: '1 1 0',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: HBC_COLORS.gray500,
  marginBottom: SPACING.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const valueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: 1.2,
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const seconds = ms / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

export const ProvisioningSummaryWidget: React.FC = () => {
  const { dataService } = useAppContext();
  const [summary, setSummary] = React.useState<IProvisioningSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    dataService.getProvisioningSummary().then(data => {
      if (!cancelled) {
        setSummary(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dataService]);

  if (loading) {
    return (
      <div style={{ padding: SPACING.md, color: HBC_COLORS.gray500, fontSize: '13px' }}>
        Loading provisioning summary...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
      role="region"
      aria-label="Provisioning summary statistics"
    >
      {/* Total Provisioned */}
      <div style={statCardStyle}>
        <span style={labelStyle}>Total Provisioned</span>
        <span style={{ ...valueStyle, color: HBC_COLORS.navy }}>
          {summary.totalProvisioned}
        </span>
      </div>

      {/* In Progress */}
      <div style={statCardStyle}>
        <span style={labelStyle}>In Progress</span>
        <span style={{ ...valueStyle, color: HBC_COLORS.orange, display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          {summary.inProgress}
          {summary.inProgress > 0 && (
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: `2px solid ${HBC_COLORS.orange}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'hbc-spin 0.8s linear infinite',
              }}
              aria-label="In progress"
            />
          )}
        </span>
        <style>{`@keyframes hbc-spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Failed */}
      <div style={statCardStyle}>
        <span style={labelStyle}>Failed</span>
        <span style={{ ...valueStyle, color: HBC_COLORS.error, display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          {summary.failed}
          {summary.failed > 0 && (
            <span
              style={{ fontSize: '16px', lineHeight: 1 }}
              role="img"
              aria-label="Warning: failures detected"
              title="Failures detected"
            >
              &#9888;
            </span>
          )}
        </span>
      </div>

      {/* Average Duration */}
      <div style={statCardStyle}>
        <span style={labelStyle}>Avg Duration</span>
        <span style={{ ...valueStyle, color: HBC_COLORS.gray800 }}>
          {formatDuration(summary.averageDurationMs)}
        </span>
      </div>

      {/* Last Provisioned */}
      <div style={statCardStyle}>
        <span style={labelStyle}>Last Provisioned</span>
        <span style={{ ...valueStyle, color: HBC_COLORS.gray800, fontSize: '16px' }}>
          {formatDate(summary.lastProvisionedAt)}
        </span>
      </div>
    </div>
  );
};
