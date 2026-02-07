import * as React from 'react';
import { Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Button } from '@fluentui/react-components';

interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<IConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false,
}) => (
  <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onCancel(); }}>
    <DialogSurface>
      <DialogBody>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent><p>{message}</p></DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button appearance="primary" onClick={onConfirm}
            style={danger ? { backgroundColor: '#EF4444' } : undefined}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>
);
