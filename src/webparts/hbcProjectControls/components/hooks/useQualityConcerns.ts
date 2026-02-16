import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IQualityConcern, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseQualityConcernsResult {
  concerns: IQualityConcern[];
  isLoading: boolean;
  error: string | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<IQualityConcern>) => Promise<IQualityConcern>;
  openCount: number;
  resolvedCount: number;
}

export function useQualityConcerns(): IUseQualityConcernsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [concerns, setConcerns] = React.useState<IQualityConcern[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchConcerns = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getQualityConcerns(projectCode);
      setConcerns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality concerns');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Quality entity changes from other users
  useSignalR({
    entityType: EntityType.Quality,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchConcerns(lastProjectCodeRef.current);
      }
    }, [fetchConcerns]),
  });

  // Helper to broadcast quality concern changes
  const broadcastQualityChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Quality,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const addConcern = React.useCallback(async (projectCode: string, concern: Partial<IQualityConcern>) => {
    const created = await dataService.addQualityConcern(projectCode, concern);
    setConcerns(prev => [...prev, created]);
    broadcastQualityChange(created.id, 'created', 'Quality concern added');
    return created;
  }, [dataService, broadcastQualityChange]);

  const updateConcern = React.useCallback(async (projectCode: string, concernId: number, data: Partial<IQualityConcern>) => {
    const updated = await dataService.updateQualityConcern(projectCode, concernId, data);
    setConcerns(prev => prev.map(c => c.id === concernId ? updated : c));
    broadcastQualityChange(concernId, 'updated', 'Quality concern updated');
    return updated;
  }, [dataService, broadcastQualityChange]);

  const openCount = React.useMemo(() => concerns.filter(c => c.status === 'Open' || c.status === 'Monitoring').length, [concerns]);
  const resolvedCount = React.useMemo(() => concerns.filter(c => c.status === 'Resolved' || c.status === 'Closed').length, [concerns]);

  return { concerns, isLoading, error, fetchConcerns, addConcern, updateConcern, openCount, resolvedCount };
}
