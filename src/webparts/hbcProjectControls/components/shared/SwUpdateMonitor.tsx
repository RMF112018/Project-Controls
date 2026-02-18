import * as React from 'react';
import { useToast } from './ToastContainer';

/**
 * Side-effect-only component (renders null).
 * Registers the service worker via workbox-window and fires a toast
 * when a new SW version is waiting to activate.
 *
 * Uses dynamic import so workbox-window is excluded from the main bundle
 * and degrades gracefully when unavailable (e.g., on a SharePoint site
 * where /sw.js doesn't exist, or when offline during first load).
 */
export const SwUpdateMonitor: React.FC = () => {
  const { addToast } = useToast();

  React.useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost') return;

    import('workbox-window')
      .then(({ Workbox }) => {
        const wb = new Workbox('/sw.js');

        wb.addEventListener('waiting', () => {
          addToast(
            'A new version is available \u2014 refreshing\u2026',
            'info',
            0
          );
          void wb.messageSkipWaiting();
        });

        wb.addEventListener('controlling', () => {
          window.location.reload();
        });

        void wb.register();
      })
      .catch(() => {
        // workbox-window unavailable or SW registration failed — silent degradation
      });
  // addToast is stable — only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
