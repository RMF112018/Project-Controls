import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IEstimatingKickoff, IEstimatingKickoffItem, IKeyPersonnelEntry, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';

interface IUseEstimatingKickoffResult {
  kickoff: IEstimatingKickoff | null;
  isLoading: boolean;
  error: string | null;
  fetchKickoff: (projectCode: string) => Promise<void>;
  fetchKickoffByLeadId: (leadId: number) => Promise<void>;
  createKickoff: (leadId: number, projectCode: string) => Promise<IEstimatingKickoff>;
  updateKickoff: (data: Partial<IEstimatingKickoff>) => Promise<void>;
  updateItem: (itemId: number, data: Partial<IEstimatingKickoffItem>) => Promise<void>;
  addItem: (item: Partial<IEstimatingKickoffItem>) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateKeyPersonnel: (personnel: IKeyPersonnelEntry[]) => Promise<void>;
}

export function useEstimatingKickoff(): IUseEstimatingKickoffResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [kickoff, setKickoff] = React.useState<IEstimatingKickoff | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchKickoff = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getEstimatingKickoff(projectCode);
      setKickoff(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kickoff');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const fetchKickoffByLeadId = React.useCallback(async (leadId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dataService.getEstimatingKickoffByLeadId(leadId);
      setKickoff(result);
      if (result?.ProjectCode) {
        lastProjectCodeRef.current = result.ProjectCode;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kickoff');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Estimate entity changes from other users
  useSignalR({
    entityType: EntityType.Estimate,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchKickoff(lastProjectCodeRef.current);
      }
    }, [fetchKickoff]),
  });

  // Helper to broadcast estimate/kickoff changes
  const broadcastEstimateChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Estimate,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: kickoff?.ProjectCode || lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser, kickoff]);

  const createKickoff = React.useCallback(async (leadId: number, projectCode: string) => {
    const created = await dataService.createEstimatingKickoff({ LeadID: leadId, ProjectCode: projectCode });
    setKickoff(created);
    lastProjectCodeRef.current = projectCode;
    broadcastEstimateChange(created.id, 'created', 'Estimating kickoff created');
    return created;
  }, [dataService, broadcastEstimateChange]);

  const updateKickoff = React.useCallback(async (data: Partial<IEstimatingKickoff>) => {
    if (!kickoff) return;
    const updated = await dataService.updateEstimatingKickoff(kickoff.id, data);
    setKickoff(updated);
    broadcastEstimateChange(kickoff.id, 'updated', 'Estimating kickoff updated');
  }, [dataService, kickoff, broadcastEstimateChange]);

  const updateItem = React.useCallback(async (itemId: number, data: Partial<IEstimatingKickoffItem>) => {
    if (!kickoff) return;
    const updatedItem = await dataService.updateKickoffItem(kickoff.id, itemId, data);
    setKickoff(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? updatedItem : i),
      };
    });
    broadcastEstimateChange(kickoff.id, 'updated', 'Kickoff item updated');
  }, [dataService, kickoff, broadcastEstimateChange]);

  const addItem = React.useCallback(async (item: Partial<IEstimatingKickoffItem>) => {
    if (!kickoff) return;
    const newItem = await dataService.addKickoffItem(kickoff.id, item);
    setKickoff(prev => prev ? { ...prev, items: [...prev.items, newItem] } : prev);
    broadcastEstimateChange(kickoff.id, 'updated', 'Kickoff item added');
  }, [dataService, kickoff, broadcastEstimateChange]);

  const removeItem = React.useCallback(async (itemId: number) => {
    if (!kickoff) return;
    await dataService.removeKickoffItem(kickoff.id, itemId);
    setKickoff(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
    broadcastEstimateChange(kickoff.id, 'updated', 'Kickoff item removed');
  }, [dataService, kickoff, broadcastEstimateChange]);

  const updateKeyPersonnel = React.useCallback(async (personnel: IKeyPersonnelEntry[]) => {
    if (!kickoff) return;
    const updated = await dataService.updateKickoffKeyPersonnel(kickoff.id, personnel);
    setKickoff(updated);
    broadcastEstimateChange(kickoff.id, 'updated', 'Key personnel updated');
  }, [dataService, kickoff, broadcastEstimateChange]);

  return {
    kickoff,
    isLoading,
    error,
    fetchKickoff,
    fetchKickoffByLeadId,
    createKickoff,
    updateKickoff,
    updateItem,
    addItem,
    removeItem,
    updateKeyPersonnel,
  };
}
