import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';

export interface ITimelineEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  detail?: string;
  type?: 'create' | 'update' | 'delete' | 'status' | 'info';
}

interface IActivityTimelineProps {
  entries: ITimelineEntry[];
  maxItems?: number;
  emptyMessage?: string;
}

const TYPE_COLORS: Record<string, string> = {
  create: HBC_COLORS.success,
  update: HBC_COLORS.info,
  delete: HBC_COLORS.error,
  status: HBC_COLORS.orange,
  info: HBC_COLORS.gray400,
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const ActivityTimeline: React.FC<IActivityTimelineProps> = ({
  entries,
  maxItems = 20,
  emptyMessage = 'No activity yet',
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? entries : entries.slice(0, maxItems);

  if (entries.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: HBC_COLORS.gray400, fontSize: '14px' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {visible.map((entry, idx) => {
        const dotColor = TYPE_COLORS[entry.type || 'info'] || HBC_COLORS.gray400;
        const isLast = idx === visible.length - 1;
        return (
          <div key={entry.id} style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: isLast ? 0 : '16px' }}>
            {/* Vertical line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  flexShrink: 0,
                  marginTop: '4px',
                }}
              />
              {!isLast && (
                <div style={{ width: '2px', flex: 1, backgroundColor: HBC_COLORS.gray200, marginTop: '4px' }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: HBC_COLORS.gray800 }}>
                  {entry.action}
                </span>
                <span style={{ fontSize: '12px', color: HBC_COLORS.gray400, flexShrink: 0 }}>
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginTop: '2px' }}>
                {entry.user}
              </div>
              {entry.detail && (
                <div style={{ fontSize: '13px', color: HBC_COLORS.gray600, marginTop: '4px', fontStyle: 'italic' }}>
                  {entry.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {!expanded && entries.length > maxItems && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: 'none',
            border: 'none',
            color: HBC_COLORS.info,
            cursor: 'pointer',
            fontSize: '13px',
            padding: '8px 0',
            marginLeft: '32px',
          }}
        >
          Show {entries.length - maxItems} more...
        </button>
      )}
    </div>
  );
};
