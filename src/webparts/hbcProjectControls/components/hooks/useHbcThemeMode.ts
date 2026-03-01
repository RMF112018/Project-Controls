import * as React from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface IUseHbcThemeModeResult {
  /** User's preference: 'light' | 'dark' | 'system' */
  themeMode: ThemeMode;
  /** Resolved effective mode after 'system' maps to OS preference */
  effectiveMode: 'light' | 'dark';
  /** Whether Windows High Contrast (forced-colors) is active */
  isHighContrast: boolean;
  /** Persist and apply a new theme preference */
  setThemeMode: (mode: ThemeMode) => void;
}

function getStorageKey(email: string | undefined): string {
  return `hbc:theme-mode:${email ?? 'anonymous'}`;
}

function readStoredMode(key: string): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Ignore corrupt or inaccessible storage
  }
  return 'system';
}

function queryMediaMatch(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.(query).matches ?? false;
}

/**
 * Hook managing user theme preference with OS detection and localStorage persistence.
 * localStorage key: hbc:theme-mode:{email} (mirrors dashboard preferences pattern).
 */
export function useHbcThemeMode(userEmail: string | undefined): IUseHbcThemeModeResult {
  const storageKey = React.useMemo(() => getStorageKey(userEmail), [userEmail]);

  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(
    () => readStoredMode(storageKey)
  );

  const [osDark, setOsDark] = React.useState(
    () => queryMediaMatch('(prefers-color-scheme: dark)')
  );

  const [isHighContrast, setIsHighContrast] = React.useState(
    () => queryMediaMatch('(forced-colors: active)')
  );

  // Track OS dark mode preference changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent): void => setOsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Track forced-colors (Windows High Contrast) changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(forced-colors: active)');
    const handler = (e: MediaQueryListEvent): void => setIsHighContrast(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Re-read stored preference when user changes (login/role switch)
  React.useEffect(() => {
    setThemeModeState(readStoredMode(storageKey));
  }, [storageKey]);

  const effectiveMode: 'light' | 'dark' = themeMode === 'system'
    ? (osDark ? 'dark' : 'light')
    : themeMode;

  const setThemeMode = React.useCallback((mode: ThemeMode): void => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, mode);
      } catch {
        // best-effort persistence
      }
    }
  }, [storageKey]);

  return React.useMemo(() => ({
    themeMode,
    effectiveMode,
    isHighContrast,
    setThemeMode,
  }), [themeMode, effectiveMode, isHighContrast, setThemeMode]);
}
