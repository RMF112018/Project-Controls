import * as React from 'react';
import { makeStyles, shorthands, Tooltip } from '@fluentui/react-components';
import { usePresence } from '../hooks/usePresence';
import { useResponsive } from '../hooks/useResponsive';
import { HBC_COLORS } from '../../theme/tokens';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  avatar: {
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  overflow: {
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: HBC_COLORS.gray500,
    flexShrink: 0,
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
  },
  dot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
});

const MAX_VISIBLE_AVATARS = 3;

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getStatusColor(status: 'active' | 'idle'): string {
  return status === 'active' ? HBC_COLORS.success : HBC_COLORS.warning;
}

function formatPage(path: string): string {
  // Clean up route path for display
  const clean = path.replace(/^\//, '').replace(/-/g, ' ');
  if (!clean) return 'Dashboard';
  return clean.charAt(0).toUpperCase() + clean.slice(0);
}

export const PresenceIndicator: React.FC = () => {
  const styles = useStyles();
  const { activeUsers } = usePresence();
  const { isMobile } = useResponsive();

  // Don't render on mobile or when no other users present
  if (isMobile || activeUsers.length === 0) return null;

  const visible = activeUsers.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = activeUsers.length - MAX_VISIBLE_AVATARS;

  const tooltipContent = (
    <div className={styles.tooltipContent}>
      {activeUsers.map(user => (
        <div key={user.email} className={styles.tooltipRow}>
          <span
            className={styles.dot}
            style={{ backgroundColor: getStatusColor(user.status) }}
          />
          <span>{user.displayName}</span>
          <span style={{ opacity: 0.7 }}>— {formatPage(user.currentPage)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} relationship="description" positioning="below">
      <div className={styles.container}>
        {visible.map(user => (
          <div
            key={user.email}
            className={styles.avatar}
            style={{ backgroundColor: getStatusColor(user.status) }}
            title={user.displayName}
          >
            {getInitials(user.displayName)}
          </div>
        ))}
        {overflowCount > 0 && (
          <div className={styles.overflow}>
            +{overflowCount}
          </div>
        )}
      </div>
    </Tooltip>
  );
};
