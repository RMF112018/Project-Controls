import * as React from 'react';
import { useLocation, useNavigate } from '@router';

/**
 * Syncs a tab selection with the URL hash query parameter `?tab=<value>`.
 * When the URL has a `tab` parameter, it is used as the initial tab.
 * When the tab changes, the URL is updated without a navigation (replace).
 */
export function useTabFromUrl<T extends string>(
  defaultTab: T,
  validTabs: readonly T[],
): [T, (tab: T) => void] {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse initial tab from URL on mount
  const initialTab = React.useMemo(() => {
    const searchStr = location.search || '';
    const params = new URLSearchParams(searchStr);
    const urlTab = params.get('tab') as T | null;
    if (urlTab && validTabs.includes(urlTab)) return urlTab;
    return defaultTab;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab] = React.useState<T>(initialTab);

  const setTab = React.useCallback((tab: T) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search || '');
    if (tab === defaultTab) {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    const newPath = qs ? `${location.pathname}?${qs}` : location.pathname;
    navigate(newPath, { replace: true });
  }, [defaultTab, location.pathname, location.search, navigate]);

  return [activeTab, setTab];
}
