import * as React from 'react';
import { useToast } from './ToastContainer';
import { useAppContext } from '../contexts/AppContext';

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
  const { telemetryService } = useAppContext();
  const didRegister = React.useRef(false);

  React.useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost') return;
    if (didRegister.current) return;
    didRegister.current = true;

    import('workbox-window')
      .then(({ Workbox }) => {
        const wb = new Workbox('/sw.js');

        wb.addEventListener('waiting', () => {
          telemetryService.trackEvent({
            name: 'chunk:load:error',
            properties: {
              scope: 'service-worker-update-waiting',
              route: window.location.hash.replace(/^#/, '') || '/',
            },
          });
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
      .catch((error) => {
        telemetryService.trackEvent({
          name: 'chunk:load:error',
          properties: {
            scope: 'service-worker-import',
            route: window.location.hash.replace(/^#/, '') || '/',
            message: error instanceof Error ? error.message.slice(0, 512) : String(error).slice(0, 512),
          },
        });
        if (error instanceof Error) {
          telemetryService.trackException(error, { scope: 'service-worker-import' });
        }
        // Stage 4 (sub-task 7): silent degradation keeps production console clean.
      });
  // addToast is stable — only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast, telemetryService]);

  return null;
};
