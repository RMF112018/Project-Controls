import {
  IPermissionTemplate,
  ISecurityGroupMapping,
  IProjectTeamAssignment,
  IResolvedPermissions,
  AuditAction,
  EntityType,
  IEntityChangedMessage,
} from '@hbc/sp-services';
import * as React from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useQueryScope } from '../../tanstack/query/useQueryScope';
import { qk } from '../../tanstack/query/queryKeys';
import {
  permissionAssignmentsOptions,
  permissionMappingsOptions,
  permissionTemplatesOptions,
} from '../../tanstack/query/queryOptions/permissionEngine';
import { useSignalRQueryInvalidation } from '../../tanstack/query/useSignalRQueryInvalidation';

export interface IUsePermissionEngineResult {
  templates: IPermissionTemplate[];
  securityGroupMappings: ISecurityGroupMapping[];
  loading: boolean;
  error: string | null;
  resolvePermissions: (userEmail: string, projectCode: string | null) => Promise<IResolvedPermissions>;
  getAccessibleProjects: (userEmail: string) => Promise<string[]>;
  getProjectTeam: (projectCode: string) => Promise<IProjectTeamAssignment[]>;
  getAllAssignments: () => Promise<IProjectTeamAssignment[]>;
  assignToProject: (data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  removeFromProject: (id: number) => Promise<void>;
  updateAssignment: (id: number, data: Partial<IProjectTeamAssignment>) => Promise<IProjectTeamAssignment>;
  inviteToSiteGroup: (projectCode: string, userEmail: string, role: string) => Promise<void>;
  createTemplate: (data: Partial<IPermissionTemplate>) => Promise<IPermissionTemplate>;
  updateTemplate: (id: number, data: Partial<IPermissionTemplate>) => Promise<IPermissionTemplate>;
  deleteTemplate: (id: number) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchMappings: () => Promise<void>;
  updateMapping: (id: number, data: Partial<ISecurityGroupMapping>) => Promise<ISecurityGroupMapping>;
}

interface IOptimisticContext {
  snapshots: Array<[ReadonlyArray<unknown>, unknown]>;
}

function snapshotQueries(
  queryClient: QueryClient,
  queryKeys: ReadonlyArray<ReadonlyArray<unknown>>
): Array<[ReadonlyArray<unknown>, unknown]> {
  const seen = new Set<string>();
  const snapshots: Array<[ReadonlyArray<unknown>, unknown]> = [];

  queryKeys.forEach((queryKey) => {
    queryClient.getQueriesData<unknown>({ queryKey }).forEach(([key, data]) => {
      const hash = JSON.stringify(key);
      if (seen.has(hash)) {
        return;
      }
      seen.add(hash);
      snapshots.push([key, data]);
    });
  });

  return snapshots;
}

function restoreSnapshots(
  queryClient: QueryClient,
  snapshots?: Array<[ReadonlyArray<unknown>, unknown]>
): void {
  snapshots?.forEach(([queryKey, previousData]) => {
    queryClient.setQueryData(queryKey, previousData);
  });
}

export function usePermissionEngine(): IUsePermissionEngineResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const scope = useQueryScope();
  const queryClient = useQueryClient();
  const [localError, setLocalError] = React.useState<string | null>(null);

  const templatesQuery = useQuery(permissionTemplatesOptions(scope, dataService));
  const mappingsQuery = useQuery(permissionMappingsOptions(scope, dataService));

  useSignalRQueryInvalidation({
    entityType: EntityType.Permission,
    queryKeys: [qk.permission.base(scope)],
  });

  useSignalRQueryInvalidation({
    entityType: EntityType.ProjectTeamAssignment,
    queryKeys: [qk.permission.assignmentsRoot(scope), qk.permission.mappings(scope)],
  });

  const invalidatePermissionQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.permission.base(scope) });
  }, [queryClient, scope]);

  const invalidateAssignmentQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.permission.assignmentsRoot(scope) });
  }, [queryClient, scope]);

  const createTemplateMutation = useMutation<IPermissionTemplate, Error, Partial<IPermissionTemplate>, IOptimisticContext>({
    mutationFn: async (data: Partial<IPermissionTemplate>): Promise<IPermissionTemplate> => dataService.createPermissionTemplate(data),
    onMutate: async (data) => {
      const queryKeys = [qk.permission.templates(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));

      const snapshots = snapshotQueries(queryClient, queryKeys);
      const optimisticId = -Date.now();
      const now = new Date().toISOString();

      queryClient.setQueryData<IPermissionTemplate[]>(qk.permission.templates(scope), (previous = []) => ([
        ...previous,
        {
          id: optimisticId,
          name: data.name ?? 'New Template',
          description: data.description ?? '',
          isGlobal: data.isGlobal ?? false,
          globalAccess: data.globalAccess ?? false,
          identityType: data.identityType ?? 'Internal',
          toolAccess: data.toolAccess ?? [],
          isDefault: data.isDefault ?? false,
          isActive: data.isActive ?? true,
          version: data.version ?? 1,
          promotedFromTier: data.promotedFromTier,
          createdBy: currentUser?.email ?? 'unknown',
          createdDate: now,
          lastModifiedBy: currentUser?.email ?? 'unknown',
          lastModifiedDate: now,
        },
      ]));

      return { snapshots };
    },
    onError: (err, _data, context) => {
      setLocalError(err.message || 'Failed to create template');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidatePermissionQueries(),
  });

  const updateTemplateMutation = useMutation<IPermissionTemplate, Error, { id: number; data: Partial<IPermissionTemplate> }, IOptimisticContext>({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IPermissionTemplate> }): Promise<IPermissionTemplate> =>
      dataService.updatePermissionTemplate(id, data),
    onMutate: async ({ id, data }) => {
      const queryKeys = [qk.permission.templates(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);

      queryClient.setQueryData<IPermissionTemplate[]>(qk.permission.templates(scope), (previous = []) => (
        previous.map((item) => (
          item.id === id
            ? {
                ...item,
                ...data,
                lastModifiedBy: currentUser?.email ?? item.lastModifiedBy,
                lastModifiedDate: new Date().toISOString(),
              }
            : item
        ))
      ));

      return { snapshots };
    },
    onError: (err, _vars, context) => {
      setLocalError(err.message || 'Failed to update template');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidatePermissionQueries(),
  });

  const deleteTemplateMutation = useMutation<void, Error, number, IOptimisticContext>({
    mutationFn: async (id: number): Promise<void> => dataService.deletePermissionTemplate(id),
    onMutate: async (id) => {
      const queryKeys = [qk.permission.templates(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);

      queryClient.setQueryData<IPermissionTemplate[]>(qk.permission.templates(scope), (previous = []) => (
        previous.filter((item) => item.id !== id)
      ));

      return { snapshots };
    },
    onError: (err, _id, context) => {
      setLocalError(err.message || 'Failed to delete template');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidatePermissionQueries(),
  });

  const updateMappingMutation = useMutation<ISecurityGroupMapping, Error, { id: number; data: Partial<ISecurityGroupMapping> }, IOptimisticContext>({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ISecurityGroupMapping> }): Promise<ISecurityGroupMapping> =>
      dataService.updateSecurityGroupMapping(id, data),
    onMutate: async ({ id, data }) => {
      const queryKeys = [qk.permission.mappings(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);

      queryClient.setQueryData<ISecurityGroupMapping[]>(qk.permission.mappings(scope), (previous = []) => (
        previous.map((item) => (item.id === id ? { ...item, ...data } : item))
      ));

      return { snapshots };
    },
    onError: (err, _vars, context) => {
      setLocalError(err.message || 'Failed to update mapping');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidatePermissionQueries(),
  });

  const assignToProjectMutation = useMutation<IProjectTeamAssignment, Error, Partial<IProjectTeamAssignment>, IOptimisticContext>({
    mutationFn: async (data: Partial<IProjectTeamAssignment>): Promise<IProjectTeamAssignment> =>
      dataService.createProjectTeamAssignment(data),
    onMutate: async (data) => {
      const queryKeys = [qk.permission.assignmentsRoot(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);
      const optimisticId = -Date.now();
      const assignedDate = new Date().toISOString();

      snapshots.forEach(([queryKey]) => {
        const queryProjectCode = String(queryKey[queryKey.length - 1]);
        if (queryProjectCode !== 'all' && data.projectCode && queryProjectCode !== data.projectCode) {
          return;
        }

        queryClient.setQueryData<IProjectTeamAssignment[]>(queryKey, (previous = []) => ([
          ...previous,
          {
            id: optimisticId,
            projectCode: data.projectCode ?? '',
            userId: data.userId ?? '',
            userDisplayName: data.userDisplayName ?? '',
            userEmail: data.userEmail ?? '',
            assignedRole: data.assignedRole ?? '',
            templateOverrideId: data.templateOverrideId,
            granularFlagOverrides: data.granularFlagOverrides,
            assignedBy: data.assignedBy ?? currentUser?.email ?? 'unknown',
            assignedDate,
            isActive: data.isActive ?? true,
          },
        ]));
      });

      return { snapshots };
    },
    onError: (err, _data, context) => {
      setLocalError(err.message || 'Failed to assign to project');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidateAssignmentQueries(),
  });

  const updateAssignmentMutation = useMutation<IProjectTeamAssignment, Error, { id: number; data: Partial<IProjectTeamAssignment> }, IOptimisticContext>({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IProjectTeamAssignment> }): Promise<IProjectTeamAssignment> =>
      dataService.updateProjectTeamAssignment(id, data),
    onMutate: async ({ id, data }) => {
      const queryKeys = [qk.permission.assignmentsRoot(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);

      queryClient.setQueriesData<IProjectTeamAssignment[]>(
        { queryKey: qk.permission.assignmentsRoot(scope) },
        (previous = []) => (
          previous.map((item) => (item.id === id ? { ...item, ...data } : item))
        )
      );

      return { snapshots };
    },
    onError: (err, _vars, context) => {
      setLocalError(err.message || 'Failed to update assignment');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidateAssignmentQueries(),
  });

  const removeAssignmentMutation = useMutation<void, Error, number, IOptimisticContext>({
    mutationFn: async (id: number): Promise<void> => dataService.removeProjectTeamAssignment(id),
    onMutate: async (id) => {
      const queryKeys = [qk.permission.assignmentsRoot(scope)] as const;
      await Promise.all(queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const snapshots = snapshotQueries(queryClient, queryKeys);

      queryClient.setQueriesData<IProjectTeamAssignment[]>(
        { queryKey: qk.permission.assignmentsRoot(scope) },
        (previous = []) => previous.filter((item) => item.id !== id)
      );

      return { snapshots };
    },
    onError: (err, _id, context) => {
      setLocalError(err.message || 'Failed to remove from project');
      restoreSnapshots(queryClient, context?.snapshots);
    },
    onSettled: async () => invalidateAssignmentQueries(),
  });

  const fetchTemplates = React.useCallback(async () => {
    setLocalError(null);
    try {
      await queryClient.fetchQuery(permissionTemplatesOptions(scope, dataService));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load templates');
    }
  }, [queryClient, scope, dataService]);

  const fetchMappings = React.useCallback(async () => {
    setLocalError(null);
    try {
      await queryClient.fetchQuery(permissionMappingsOptions(scope, dataService));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load mappings');
    }
  }, [queryClient, scope, dataService]);

  const broadcastPermissionChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Permission,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const broadcastAssignmentChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.ProjectTeamAssignment,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const resolvePermissions = React.useCallback(async (userEmail: string, projectCode: string | null) => {
    try {
      return await dataService.resolveUserPermissions(userEmail, projectCode);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to resolve permissions');
      throw err;
    }
  }, [dataService]);

  const getAccessibleProjects = React.useCallback(async (userEmail: string) => {
    try {
      return await dataService.getAccessibleProjects(userEmail);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to get accessible projects');
      return [];
    }
  }, [dataService]);

  const getProjectTeam = React.useCallback(async (projectCode: string) => {
    try {
      return await queryClient.fetchQuery(permissionAssignmentsOptions(scope, dataService, projectCode));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to get project team');
      return [];
    }
  }, [queryClient, scope, dataService]);

  const getAllAssignments = React.useCallback(async () => {
    try {
      return await queryClient.fetchQuery(permissionAssignmentsOptions(scope, dataService));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to get all assignments');
      return [];
    }
  }, [queryClient, scope, dataService]);

  const inviteToSiteGroup = React.useCallback(async (
    projectCode: string, userEmail: string, role: string
  ) => {
    try {
      return await dataService.inviteToProjectSiteGroup(projectCode, userEmail, role);
    } catch (err) {
      console.warn('inviteToProjectSiteGroup failed (non-blocking):', err);
      dataService.logAudit({
        Action: AuditAction.GraphGroupMemberAddFailed,
        EntityType: EntityType.ProjectTeamAssignment,
        EntityId: `${projectCode}/${userEmail}`,
        ProjectCode: projectCode,
        Details: `Site group invitation failed for ${userEmail} (role: ${role}): ${err instanceof Error ? err.message : String(err)}`,
      }).catch(() => { /* audit is non-blocking */ });
    }
  }, [dataService]);

  const assignToProject = React.useCallback(async (data: Partial<IProjectTeamAssignment>) => {
    try {
      const result = await assignToProjectMutation.mutateAsync(data);
      broadcastAssignmentChange(result.id, 'created', 'Team member assigned to project');
      return result;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to assign to project');
      throw err;
    }
  }, [assignToProjectMutation, broadcastAssignmentChange]);

  const removeFromProject = React.useCallback(async (id: number) => {
    try {
      await removeAssignmentMutation.mutateAsync(id);
      broadcastAssignmentChange(id, 'deleted', 'Team member removed from project');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to remove from project');
      throw err;
    }
  }, [removeAssignmentMutation, broadcastAssignmentChange]);

  const updateAssignment = React.useCallback(async (id: number, data: Partial<IProjectTeamAssignment>) => {
    try {
      const result = await updateAssignmentMutation.mutateAsync({ id, data });
      broadcastAssignmentChange(id, 'updated', 'Team assignment updated');
      return result;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update assignment');
      throw err;
    }
  }, [updateAssignmentMutation, broadcastAssignmentChange]);

  const createTemplate = React.useCallback(async (data: Partial<IPermissionTemplate>) => {
    try {
      const result = await createTemplateMutation.mutateAsync(data);
      broadcastPermissionChange(result.id, 'created', 'Permission template created');
      return result;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    }
  }, [createTemplateMutation, broadcastPermissionChange]);

  const updateTemplate = React.useCallback(async (id: number, data: Partial<IPermissionTemplate>) => {
    try {
      const result = await updateTemplateMutation.mutateAsync({ id, data });
      broadcastPermissionChange(id, 'updated', 'Permission template updated');
      return result;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update template');
      throw err;
    }
  }, [updateTemplateMutation, broadcastPermissionChange]);

  const deleteTemplate = React.useCallback(async (id: number) => {
    try {
      await deleteTemplateMutation.mutateAsync(id);
      broadcastPermissionChange(id, 'deleted', 'Permission template deleted');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to delete template');
      throw err;
    }
  }, [deleteTemplateMutation, broadcastPermissionChange]);

  const updateMapping = React.useCallback(async (id: number, data: Partial<ISecurityGroupMapping>) => {
    try {
      const result = await updateMappingMutation.mutateAsync({ id, data });
      broadcastPermissionChange(id, 'updated', 'Security group mapping updated');
      return result;
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update mapping');
      throw err;
    }
  }, [updateMappingMutation, broadcastPermissionChange]);

  const templates = React.useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const securityGroupMappings = React.useMemo(() => mappingsQuery.data ?? [], [mappingsQuery.data]);

  const queryError = templatesQuery.error ?? mappingsQuery.error;
  const error = localError ?? (queryError instanceof Error ? queryError.message : null);

  const loading =
    templatesQuery.isFetching ||
    mappingsQuery.isFetching ||
    createTemplateMutation.isPending ||
    updateTemplateMutation.isPending ||
    deleteTemplateMutation.isPending ||
    updateMappingMutation.isPending ||
    assignToProjectMutation.isPending ||
    updateAssignmentMutation.isPending ||
    removeAssignmentMutation.isPending;

  return {
    templates,
    securityGroupMappings,
    loading,
    error,
    resolvePermissions,
    getAccessibleProjects,
    getProjectTeam,
    getAllAssignments,
    assignToProject,
    removeFromProject,
    updateAssignment,
    inviteToSiteGroup,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates,
    fetchMappings,
    updateMapping,
  };
}
