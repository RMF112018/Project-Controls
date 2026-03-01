/**
 * Phase 3 (GNG Plan) — Version-conflict resolution dialog.
 * Shows when concurrent edits are detected on a scorecard.
 * Offers Overwrite (last-writer-wins), Reload, or Cancel.
 */
import * as React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
} from '@fluentui/react-components';

export interface IConflictDialogProps {
  open: boolean;
  lastModifiedBy: string;
  lastModifiedDate: string;
  onOverwrite: () => void;
  onRefresh: () => void;
  onCancel: () => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const ConflictDialog: React.FC<IConflictDialogProps> = React.memo(({
  open,
  lastModifiedBy,
  lastModifiedDate,
  onOverwrite,
  onRefresh,
  onCancel,
}) => {
  const formattedTime = React.useMemo(
    () => lastModifiedDate ? formatTimestamp(lastModifiedDate) : 'recently',
    [lastModifiedDate],
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onCancel(); }}>
      <DialogSurface role="alertdialog" aria-describedby="conflict-message">
        <DialogBody>
          <DialogTitle>Concurrent Edit Detected</DialogTitle>
          <DialogContent>
            <p id="conflict-message">
              This scorecard was modified by <strong>{lastModifiedBy || 'another user'}</strong> at{' '}
              <strong>{formattedTime}</strong>. Your changes may overwrite theirs.
            </p>
          </DialogContent>
          <DialogActions>
            <Button appearance="subtle" onClick={onCancel}>Cancel</Button>
            <Button appearance="secondary" onClick={onRefresh}>Reload</Button>
            <Button
              appearance="primary"
              onClick={onOverwrite}
              style={{ backgroundColor: '#EF4444' }}
            >
              Overwrite
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
});
ConflictDialog.displayName = 'ConflictDialog';
