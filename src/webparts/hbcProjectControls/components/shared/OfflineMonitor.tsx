import * as React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from './ToastContainer';

/**
 * Side-effect-only component (renders null).
 * Fires a persistent offline warning toast and dismisses it when connectivity is restored.
 */
export const OfflineMonitor: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { addToast, dismissToast } = useToast();
  const prevOnline = React.useRef<boolean | null>(null);
  const offlineToastId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (prevOnline.current === null) {
      // First render — show toast if already offline at mount time
      prevOnline.current = isOnline;
      if (!isOnline) {
        offlineToastId.current = addToast(
          'You are offline \u2014 live data features are unavailable',
          'warning',
          0
        );
      }
      return;
    }

    if (!isOnline && prevOnline.current) {
      // Transitioned online → offline
      offlineToastId.current = addToast(
        'You are offline \u2014 live data features are unavailable',
        'warning',
        0
      );
    } else if (isOnline && !prevOnline.current) {
      // Transitioned offline → online
      if (offlineToastId.current) {
        dismissToast(offlineToastId.current);
        offlineToastId.current = null;
      }
      addToast('Back online', 'success', 3000);
    }

    prevOnline.current = isOnline;
  }, [isOnline, addToast, dismissToast]);

  return null;
};
