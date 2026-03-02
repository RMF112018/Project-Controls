import * as React from 'react';
import { useAppContext } from '../../components/contexts/AppContext';
import type { IQueryScope } from './queryKeys';

export function useQueryScope(): IQueryScope {
  const { dataServiceMode, selectedProject, isProjectSite } = useAppContext();

  return React.useMemo<IQueryScope>(() => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return {
      mode: dataServiceMode,
      siteContext: isProjectSite ? 'project' : 'hub',
      siteUrl,
      projectCode: selectedProject?.projectCode ?? null,
      projectUuid: selectedProject?.projectUuid ?? null, // HBC-PC-UUID-001
    };
  }, [dataServiceMode, isProjectSite, selectedProject?.projectCode, selectedProject?.projectUuid]);
}
