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
  const didRegister = React.useRef(false);

  React.useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost') return;
    if (didRegister.current) return;
    didRegister.current = true;

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

        // Stage 4 (sub-task 2): register once and avoid noisy duplicate attempts.
        void wb.register();
      })
      .catch(() => {
        // Stage 4 (sub-task 7): silent degradation keeps production console clean.
      });
  // addToast is stable — only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
