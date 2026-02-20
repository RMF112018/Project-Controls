import * as React from 'react';
import { useAppContext } from '../../components/contexts/AppContext';
import type { IQueryScope } from './queryKeys';
import { extractProjectIdFromPathname } from '../../components/hooks/useProjectRouteId';

function readProjectCodeFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const hash = window.location.hash.replace(/^#/, '');
  const pathname = hash.startsWith('/') ? hash : `/${hash}`;
  return extractProjectIdFromPathname(pathname);
}

export function useQueryScope(): IQueryScope {
  const { dataServiceMode, isProjectSite } = useAppContext();
  const [projectCode, setProjectCode] = React.useState<string | null>(() => readProjectCodeFromUrl());

  React.useEffect(() => {
    const syncFromLocation = (): void => setProjectCode(readProjectCodeFromUrl());
    syncFromLocation();
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  return React.useMemo<IQueryScope>(() => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return {
      mode: dataServiceMode,
      siteContext: isProjectSite ? 'project' : 'hub',
      siteUrl,
      projectCode,
    };
  }, [dataServiceMode, isProjectSite, projectCode]);
}
