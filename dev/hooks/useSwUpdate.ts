/**
 * Registers the service worker via workbox-window and fires a toast
 * when a new SW version is waiting to activate.
 *
 * Dynamic import keeps workbox-window out of the main bundle code path.
 * Skipped entirely on localhost (where SW registration is also skipped in index.html).
 */
import * as React from 'react';

type AddToastFn = (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => string;

export function useSwUpdate(addToast: AddToastFn): void {
  React.useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost') return;

    import('workbox-window')
      .then(({ Workbox }) => {
        const wb = new Workbox('/sw.js');

        wb.addEventListener('waiting', () => {
          // Show persistent "update available" toast (duration 0 = no auto-dismiss)
          addToast(
            'A new version is available \u2014 refreshing\u2026',
            'info',
            0
          );
          // Instruct the waiting SW to take control immediately
          void wb.messageSkipWaiting();
        });

        wb.addEventListener('controlling', () => {
          // New SW is now controlling the page — reload to activate new assets
          window.location.reload();
        });

        void wb.register();
      })
      .catch(() => {
        // workbox-window unavailable (e.g., offline during first load) — silent degradation
      });
  // addToast is stable (useCallback in ToastProvider) — safe to include
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
