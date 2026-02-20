import * as React from 'react';
import { Stage } from '@hbc/sp-services';
import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { getProjectQueryKey, type ProjectIdentifier } from '../../tanstack/query/projectKeys';
import type { IProjectMetadata } from './useProjectSelection';

interface IUseProjectMetadataResult {
  metadata: IProjectMetadata | null;
  isLoading: boolean;
}

export function useProjectMetadata(projectId: ProjectIdentifier | null): IUseProjectMetadataResult {
  const { dataService } = useAppContext();

  const metadataQuery = useQuery({
    queryKey: [...getProjectQueryKey(projectId), 'metadata'],
    enabled: Boolean(projectId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<IProjectMetadata | null> => {
      if (!projectId) {
        return null;
      }

      const results = await dataService.searchLeads(projectId);
      const lead = results.find((item) => item.ProjectCode?.toLowerCase() === projectId.toLowerCase());
      if (!lead) {
        return {
          projectCode: projectId,
          projectName: projectId,
          stage: Stage.ActiveConstruction,
        };
      }

      return {
        projectCode: projectId,
        projectName: lead.Title ?? projectId,
        stage: lead.Stage,
        region: lead.Region,
        division: lead.Division,
        leadId: lead.id,
      };
    },
  });

  const metadata = React.useMemo<IProjectMetadata | null>(() => {
    if (metadataQuery.data) {
      return {
        projectCode: metadataQuery.data.projectCode,
        projectName: metadataQuery.data.projectName,
        stage: metadataQuery.data.stage,
        region: metadataQuery.data.region,
        division: metadataQuery.data.division,
        leadId: metadataQuery.data.leadId,
        siteUrl: metadataQuery.data.siteUrl,
      };
    }

    if (!projectId) {
      return null;
    }

    return {
      projectCode: projectId,
      projectName: projectId,
      stage: Stage.ActiveConstruction,
    };
  }, [
    projectId,
    metadataQuery.data?.projectCode,
    metadataQuery.data?.projectName,
    metadataQuery.data?.stage,
    metadataQuery.data?.region,
    metadataQuery.data?.division,
    metadataQuery.data?.leadId,
    metadataQuery.data?.siteUrl,
  ]);

  return React.useMemo(() => ({
    metadata,
    isLoading: metadataQuery.isLoading,
  }), [metadata, metadataQuery.isLoading]);
}
