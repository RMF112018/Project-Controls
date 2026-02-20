import * as React from 'react';
import type { Stage } from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { useAppLocation } from './router/useAppLocation';
import { useAppNavigate } from './router/useAppNavigate';
import { extractProjectIdFromPathname, useProjectRouteId } from './useProjectRouteId';
import { useProjectPersistence } from './useProjectPersistence';
import type { ProjectIdentifier } from '../../tanstack/query/projectKeys';
import { useProjectMetadata } from './useProjectMetadata';

function isOperationsPath(pathname: string): boolean {
  return pathname === '/operations' || pathname.startsWith('/operations/');
}

function toProjectPath(pathname: string, projectId: ProjectIdentifier | null): string {
  if (!projectId) {
    return '/operations';
  }

  if (!isOperationsPath(pathname)) {
    return `/operations/${projectId}/project`;
  }

  const currentId = extractProjectIdFromPathname(pathname);
  if (currentId) {
    return pathname.replace(`/operations/${encodeURIComponent(currentId)}/`, `/operations/${encodeURIComponent(projectId)}/`);
  }

  if (pathname === '/operations') {
    return `/operations/${encodeURIComponent(projectId)}/project`;
  }

  return `/operations/${encodeURIComponent(projectId)}${pathname.slice('/operations'.length)}`;
}

export interface IProjectMetadata {
  projectCode: string;
  projectName: string;
  stage: Stage;
  region?: string;
  division?: string;
  leadId?: number;
  siteUrl?: string;
}

export interface IProjectSelectionResult {
  projectId: ProjectIdentifier | null;
  projectCode: string | null;
  projectMeta: IProjectMetadata | null;
  setProjectId: (projectId: ProjectIdentifier | null) => void;
  toScopedPath: (basePath: string) => string;
}

export function useProjectSelection(): IProjectSelectionResult {
  const navigate = useAppNavigate();
  const location = useAppLocation();
  const routeProjectId = useProjectRouteId();
  const { currentUser } = useAppContext();
  const persistence = useProjectPersistence(currentUser?.email ?? 'anonymous');
  const { metadata } = useProjectMetadata(routeProjectId);

  const setProjectId = React.useCallback((projectId: ProjectIdentifier | null): void => {
    const nextPath = toProjectPath(location.pathname, projectId);
    React.startTransition(() => {
      navigate(nextPath);
    });

    persistence.savePersistedProjectId(projectId);
    if (projectId) {
      persistence.saveRecentProject(projectId);
    }
  }, [location.pathname, navigate, persistence]);

  const toScopedPath = React.useCallback((basePath: string): string => {
    if (!routeProjectId) {
      return basePath;
    }
    return toProjectPath(basePath, routeProjectId);
  }, [routeProjectId]);

  const projectMeta = React.useMemo<IProjectMetadata | null>(() => {
    if (!metadata) return null;
    return {
      projectCode: metadata.projectCode,
      projectName: metadata.projectName,
      stage: metadata.stage,
      region: metadata.region,
      division: metadata.division,
      leadId: metadata.leadId,
      siteUrl: metadata.siteUrl,
    };
  }, [
    metadata?.projectCode,
    metadata?.projectName,
    metadata?.stage,
    metadata?.region,
    metadata?.division,
    metadata?.leadId,
    metadata?.siteUrl,
  ]);

  return React.useMemo(() => {
    const metaProjectCode = projectMeta?.projectCode ?? null;
    const metaProjectName = projectMeta?.projectName ?? null;
    const metaStage = projectMeta?.stage ?? null;
    const metaRegion = projectMeta?.region ?? null;
    const metaDivision = projectMeta?.division ?? null;
    const metaLeadId = projectMeta?.leadId ?? null;
    const metaSiteUrl = projectMeta?.siteUrl ?? null;

    const stableProjectMeta = metaProjectCode && metaProjectName && metaStage
      ? {
        projectCode: metaProjectCode,
        projectName: metaProjectName,
        stage: metaStage,
        region: metaRegion ?? undefined,
        division: metaDivision ?? undefined,
        leadId: metaLeadId ?? undefined,
        siteUrl: metaSiteUrl ?? undefined,
      }
      : null;

    return {
      projectId: routeProjectId,
      projectCode: routeProjectId,
      projectMeta: stableProjectMeta,
      setProjectId,
      toScopedPath,
    };
  }, [
    routeProjectId,
    projectMeta?.projectCode,
    projectMeta?.projectName,
    projectMeta?.stage,
    projectMeta?.region,
    projectMeta?.division,
    projectMeta?.leadId,
    projectMeta?.siteUrl,
    setProjectId,
    toScopedPath,
  ]);
}
