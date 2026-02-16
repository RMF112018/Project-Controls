import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IInternalMatrixTask, ITeamRoleAssignment, IOwnerContractArticle, ISubContractClause, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseResponsibilityMatrixResult {
  internalTasks: IInternalMatrixTask[];
  ownerArticles: IOwnerContractArticle[];
  subClauses: ISubContractClause[];
  teamAssignments: ITeamRoleAssignment[];
  isLoading: boolean;
  error: string | null;
  fetchInternalMatrix: (projectCode: string) => Promise<void>;
  fetchOwnerContractMatrix: (projectCode: string) => Promise<void>;
  fetchSubContractMatrix: (projectCode: string) => Promise<void>;
  fetchTeamAssignments: (projectCode: string) => Promise<void>;
  updateInternalTask: (projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>) => Promise<IInternalMatrixTask>;
  addInternalTask: (projectCode: string, task: Partial<IInternalMatrixTask>) => Promise<IInternalMatrixTask>;
  removeInternalTask: (projectCode: string, taskId: number) => Promise<void>;
  updateTeamAssignment: (projectCode: string, role: string, person: string, email?: string) => Promise<ITeamRoleAssignment>;
  updateOwnerArticle: (projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>) => Promise<IOwnerContractArticle>;
  addOwnerArticle: (projectCode: string, item: Partial<IOwnerContractArticle>) => Promise<IOwnerContractArticle>;
  removeOwnerArticle: (projectCode: string, itemId: number) => Promise<void>;
  updateSubClause: (projectCode: string, itemId: number, data: Partial<ISubContractClause>) => Promise<ISubContractClause>;
  addSubClause: (projectCode: string, item: Partial<ISubContractClause>) => Promise<ISubContractClause>;
  removeSubClause: (projectCode: string, itemId: number) => Promise<void>;
}

export function useResponsibilityMatrix(): IUseResponsibilityMatrixResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [internalTasks, setInternalTasks] = React.useState<IInternalMatrixTask[]>([]);
  const [ownerArticles, setOwnerArticles] = React.useState<IOwnerContractArticle[]>([]);
  const [subClauses, setSubClauses] = React.useState<ISubContractClause[]>([]);
  const [teamAssignments, setTeamAssignments] = React.useState<ITeamRoleAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchInternalMatrix = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getInternalMatrix(projectCode);
      setInternalTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch internal matrix');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchOwnerContractMatrix = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getOwnerContractMatrix(projectCode);
      setOwnerArticles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch owner contract matrix');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchSubContractMatrix = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getSubContractMatrix(projectCode);
      setSubClauses(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sub-contract matrix');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchTeamAssignments = React.useCallback(async (projectCode: string) => {
    try {
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getTeamRoleAssignments(projectCode);
      setTeamAssignments(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team assignments');
    }
  }, [dataService]);

  // SignalR: refresh on Matrix entity changes from other users
  useSignalR({
    entityType: EntityType.Matrix,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchInternalMatrix(lastProjectCodeRef.current);
      }
    }, [fetchInternalMatrix]),
  });

  // Helper to broadcast matrix changes
  const broadcastMatrixChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Matrix,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateInternalTask = React.useCallback(async (projectCode: string, taskId: number, data: Partial<IInternalMatrixTask>) => {
    const updated = await dataService.updateInternalMatrixTask(projectCode, taskId, data);
    setInternalTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    broadcastMatrixChange(taskId, 'updated', 'Internal task updated');
    return updated;
  }, [dataService, broadcastMatrixChange]);

  const addInternalTask = React.useCallback(async (projectCode: string, task: Partial<IInternalMatrixTask>) => {
    const created = await dataService.addInternalMatrixTask(projectCode, task);
    setInternalTasks(prev => [...prev, created]);
    broadcastMatrixChange(created.id, 'created', 'Internal task added');
    return created;
  }, [dataService, broadcastMatrixChange]);

  const removeInternalTask = React.useCallback(async (projectCode: string, taskId: number) => {
    await dataService.removeInternalMatrixTask(projectCode, taskId);
    setInternalTasks(prev => prev.filter(t => t.id !== taskId));
    broadcastMatrixChange(taskId, 'deleted', 'Internal task removed');
  }, [dataService, broadcastMatrixChange]);

  const updateTeamAssignment = React.useCallback(async (projectCode: string, role: string, person: string, email?: string) => {
    const updated = await dataService.updateTeamRoleAssignment(projectCode, role, person, email);
    setTeamAssignments(prev => {
      const idx = prev.findIndex(a => a.roleAbbreviation === role);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    broadcastMatrixChange(role, 'updated', 'Team assignment updated');
    return updated;
  }, [dataService, broadcastMatrixChange]);

  const updateOwnerArticle = React.useCallback(async (projectCode: string, itemId: number, data: Partial<IOwnerContractArticle>) => {
    const updated = await dataService.updateOwnerContractArticle(projectCode, itemId, data);
    setOwnerArticles(prev => prev.map(a => a.id === itemId ? updated : a));
    broadcastMatrixChange(itemId, 'updated', 'Owner contract article updated');
    return updated;
  }, [dataService, broadcastMatrixChange]);

  const addOwnerArticle = React.useCallback(async (projectCode: string, item: Partial<IOwnerContractArticle>) => {
    const created = await dataService.addOwnerContractArticle(projectCode, item);
    setOwnerArticles(prev => [...prev, created]);
    broadcastMatrixChange(created.id, 'created', 'Owner contract article added');
    return created;
  }, [dataService, broadcastMatrixChange]);

  const removeOwnerArticle = React.useCallback(async (projectCode: string, itemId: number) => {
    await dataService.removeOwnerContractArticle(projectCode, itemId);
    setOwnerArticles(prev => prev.filter(a => a.id !== itemId));
    broadcastMatrixChange(itemId, 'deleted', 'Owner contract article removed');
  }, [dataService, broadcastMatrixChange]);

  const updateSubClause = React.useCallback(async (projectCode: string, itemId: number, data: Partial<ISubContractClause>) => {
    const updated = await dataService.updateSubContractClause(projectCode, itemId, data);
    setSubClauses(prev => prev.map(c => c.id === itemId ? updated : c));
    broadcastMatrixChange(itemId, 'updated', 'Sub-contract clause updated');
    return updated;
  }, [dataService, broadcastMatrixChange]);

  const addSubClause = React.useCallback(async (projectCode: string, item: Partial<ISubContractClause>) => {
    const created = await dataService.addSubContractClause(projectCode, item);
    setSubClauses(prev => [...prev, created]);
    broadcastMatrixChange(created.id, 'created', 'Sub-contract clause added');
    return created;
  }, [dataService, broadcastMatrixChange]);

  const removeSubClause = React.useCallback(async (projectCode: string, itemId: number) => {
    await dataService.removeSubContractClause(projectCode, itemId);
    setSubClauses(prev => prev.filter(c => c.id !== itemId));
    broadcastMatrixChange(itemId, 'deleted', 'Sub-contract clause removed');
  }, [dataService, broadcastMatrixChange]);

  return {
    internalTasks, ownerArticles, subClauses, teamAssignments,
    isLoading, error,
    fetchInternalMatrix, fetchOwnerContractMatrix, fetchSubContractMatrix, fetchTeamAssignments,
    updateInternalTask, addInternalTask, removeInternalTask,
    updateTeamAssignment,
    updateOwnerArticle, addOwnerArticle, removeOwnerArticle,
    updateSubClause, addSubClause, removeSubClause,
  };
}
