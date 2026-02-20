import { useProjectSelection } from './useProjectSelection';
import * as React from 'react';

/**
 * @deprecated TODO(PC-Phase1A-cleanup): remove this compatibility shim once all callers use useProjectSelection directly.
 */
export const useSelectedProject = () => {
  const { projectMeta, setProjectId } = useProjectSelection();

  return React.useMemo(() => ({
    selectedProject: projectMeta,
    setSelectedProject: (project: { projectCode?: string } | null) => setProjectId(project?.projectCode ?? null),
    projectCode: projectMeta?.projectCode ?? null,
  }), [projectMeta, setProjectId]);
};
