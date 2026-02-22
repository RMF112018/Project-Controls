import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppContext, type ISelectedProject } from '../contexts/AppContext';
import { useProjectProfile } from './useProjectProfile';
import { useAppNavigate } from './router/useAppNavigate';

export interface ISwitchProjectOptions {
  project: ISelectedProject;
  targetRoute?: string; // defaults to current route
}

export interface IUseSwitchProjectResult {
  switchProject: (options: ISwitchProjectOptions) => void;
  isPending: boolean;
  switchingToName: string | null;
}

/**
 * TanStack Query v5 mutation for optimistic project switching.
 * - onMutate: sets selectedProject optimistically + addRecent
 * - onError: rolls back to previousProject
 * - onSuccess: enriches with KPI data via ProjectService
 * - Uses useAppNavigate for post-switch navigation (never touches router creation)
 */
export function useSwitchProject(): IUseSwitchProjectResult {
  const { setSelectedProject, selectedProject } = useAppContext();
  const navProfile = useProjectProfile();
  const navigate = useAppNavigate();

  // Track which project we're switching to for skeleton text
  const [switchingToName, setSwitchingToName] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ['project-switch'],
    mutationFn: async (options: ISwitchProjectOptions) => {
      // Attempt KPI enrichment — graceful degradation if it fails
      try {
        const kpi = await navProfile.getKpiSnapshot(options.project.projectCode);
        if (kpi) {
          return {
            ...options.project,
            overallHealth: kpi.overallHealth,
            projectValue: kpi.currentContractValue,
            clientName: kpi.clientName,
          } as ISelectedProject;
        }
      } catch {
        // KPI lookup failed — switch still succeeds with base project data
      }
      return options.project;
    },
    onMutate: (options: ISwitchProjectOptions) => {
      const previousProject = selectedProject;
      setSwitchingToName(options.project.projectName);

      // Optimistic: set the project immediately
      setSelectedProject(options.project);

      // Track recent access
      navProfile.addRecent(options.project.projectCode);

      return { previousProject };
    },
    onError: (_error, _variables, context) => {
      // Rollback to previous project
      if (context?.previousProject !== undefined) {
        setSelectedProject(context.previousProject);
      }
      setSwitchingToName(null);
    },
    onSuccess: (enrichedProject, options) => {
      // Only update if KPI data was actually enriched — use skipSwitchingFlag
      // to avoid restarting the isProjectSwitching timer (onMutate already set it)
      const hasNewKpi = enrichedProject.overallHealth !== undefined
        || enrichedProject.projectValue !== undefined
        || enrichedProject.clientName !== undefined;

      if (hasNewKpi && enrichedProject.projectCode === options.project.projectCode) {
        setSelectedProject(enrichedProject, { skipSwitchingFlag: true });
      }

      // Navigate to target route if specified
      if (options.targetRoute) {
        navigate(options.targetRoute);
      }

      setSwitchingToName(null);
    },
    onSettled: () => {
      setSwitchingToName(null);
    },
  });

  const mutate = mutation.mutate;
  const switchProject = React.useCallback(
    (options: ISwitchProjectOptions) => {
      mutate(options);
    },
    [mutate]
  );

  return {
    switchProject,
    isPending: mutation.isPending,
    switchingToName,
  };
}
