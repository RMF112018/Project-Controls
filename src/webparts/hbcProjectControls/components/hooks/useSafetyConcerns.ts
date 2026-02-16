import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ISafetyConcern, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseSafetyConcernsResult {
  concerns: ISafetyConcern[];
  isLoading: boolean;
  error: string | null;
  safetyOfficer: { name: string; email: string } | null;
  fetchConcerns: (projectCode: string) => Promise<void>;
  addConcern: (projectCode: string, concern: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  updateConcern: (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) => Promise<ISafetyConcern>;
  bySeverity: Record<string, ISafetyConcern[]>;
}

export function useSafetyConcerns(): IUseSafetyConcernsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [concerns, setConcerns] = React.useState<ISafetyConcern[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchConcerns = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getSafetyConcerns(projectCode);
      setConcerns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safety concerns');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Safety entity changes from other users
  useSignalR({
    entityType: EntityType.Safety,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchConcerns(lastProjectCodeRef.current);
      }
    }, [fetchConcerns]),
  });

  // Helper to broadcast safety concern changes
  const broadcastSafetyChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Safety,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const addConcern = React.useCallback(async (projectCode: string, concern: Partial<ISafetyConcern>) => {
    const created = await dataService.addSafetyConcern(projectCode, concern);
    setConcerns(prev => [...prev, created]);
    broadcastSafetyChange(created.id, 'created', 'Safety concern added');
    return created;
  }, [dataService, broadcastSafetyChange]);

  const updateConcern = React.useCallback(async (projectCode: string, concernId: number, data: Partial<ISafetyConcern>) => {
    const updated = await dataService.updateSafetyConcern(projectCode, concernId, data);
    setConcerns(prev => prev.map(c => c.id === concernId ? updated : c));
    broadcastSafetyChange(concernId, 'updated', 'Safety concern updated');
    return updated;
  }, [dataService, broadcastSafetyChange]);

  const safetyOfficer = React.useMemo(() => {
    const first = concerns.find(c => c.safetyOfficerName);
    return first ? { name: first.safetyOfficerName, email: first.safetyOfficerEmail } : null;
  }, [concerns]);

  const bySeverity = React.useMemo(() => {
    const grouped: Record<string, ISafetyConcern[]> = {};
    concerns.forEach(c => {
      if (!grouped[c.severity]) grouped[c.severity] = [];
      grouped[c.severity].push(c);
    });
    return grouped;
  }, [concerns]);

  return { concerns, isLoading, error, safetyOfficer, fetchConcerns, addConcern, updateConcern, bySeverity };
}
