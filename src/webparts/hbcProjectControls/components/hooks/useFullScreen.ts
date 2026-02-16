import * as React from 'react';

export interface IUseFullScreenResult {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  exitFullScreen: () => void;
}

/** CSS to hide SharePoint page chrome when in full-screen mode */
const SP_HIDE_CSS = `
#SuiteNavWrapper,
#spCommandBar,
.sp-appBar,
[data-automationid="SiteHeader"],
.SPPageChrome,
.CanvasZone--read .CanvasZone-topPlaceholder,
#sp-appBar {
  display: none !important;
}
`;

const STYLE_ID = 'hbc-fullscreen-sp-hide';

function isInSharePoint(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).__themeState__ || document.querySelector('#SuiteNavWrapper') !== null;
}

/**
 * Hook providing full-screen toggle functionality.
 * - In SharePoint: injects CSS to hide SP chrome (the app root is positioned fixed by AppShell).
 * - In dev/standalone: uses the native Fullscreen API for true browser full-screen.
 */
export function useFullScreen(): IUseFullScreenResult {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const spMode = React.useRef(isInSharePoint());

  const enterFullScreen = React.useCallback(() => {
    setIsFullScreen(true);

    if (spMode.current) {
      // Inject style to hide SP chrome
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = SP_HIDE_CSS;
        document.head.appendChild(style);
      }
    } else {
      // Native Fullscreen API
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => { /* user denied or unavailable */ });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen().catch(() => { /* webkit fallback */ });
      }
    }
  }, []);

  const exitFullScreen = React.useCallback(() => {
    setIsFullScreen(false);

    if (spMode.current) {
      const style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    } else {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
      };
      if (document.fullscreenElement) {
        doc.exitFullscreen().catch(() => { /* already exited */ });
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen().catch(() => { /* webkit fallback */ });
      }
    }
  }, []);

  const toggleFullScreen = React.useCallback(() => {
    if (isFullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  // Sync state when user exits native fullscreen via Esc (dev mode)
  React.useEffect(() => {
    if (spMode.current) return;

    const handleChange = (): void => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  // Cleanup on unmount: remove injected style if still present
  React.useEffect(() => {
    return () => {
      const style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    };
  }, []);

  return { isFullScreen, toggleFullScreen, exitFullScreen };
}
