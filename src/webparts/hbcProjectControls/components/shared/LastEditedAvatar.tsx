/**
 * Phase 3 (GNG Plan) — Tiny avatar showing who last edited a criterion score.
 * Uses Fluent UI Avatar (size 20) with initials and Tooltip.
 */
import * as React from 'react';
import { Avatar, Tooltip, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: tokens.spacingHorizontalXXS,
  },
});

export interface ILastEditedAvatarProps {
  email?: string;
  name?: string;
  timestamp?: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const LastEditedAvatar: React.FC<ILastEditedAvatarProps> = React.memo(({ email, name, timestamp }) => {
  const styles = useStyles();

  if (!email) return null;

  const displayName = name ?? email.split('@')[0];
  const tooltipContent = timestamp
    ? `Last edited by ${displayName} at ${formatTimestamp(timestamp)}`
    : `Last edited by ${displayName}`;

  return (
    <Tooltip content={tooltipContent} relationship="label">
      <span className={styles.wrapper}>
        <Avatar
          name={displayName}
          size={20}
          aria-label={tooltipContent}
        />
      </span>
    </Tooltip>
  );
});
LastEditedAvatar.displayName = 'LastEditedAvatar';
