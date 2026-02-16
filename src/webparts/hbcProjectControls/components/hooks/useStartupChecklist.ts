import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IStartupChecklistItem, IStartupChecklistSummary, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseStartupChecklistResult {
  items: IStartupChecklistItem[];
  isLoading: boolean;
  error: string | null;
  fetchChecklist: (projectCode: string) => Promise<void>;
  updateItem: (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) => Promise<IStartupChecklistItem>;
  addItem: (projectCode: string, item: Partial<IStartupChecklistItem>) => Promise<IStartupChecklistItem>;
  removeItem: (projectCode: string, itemId: number) => Promise<void>;
  getSummary: () => IStartupChecklistSummary;
  getSectionSummary: (sectionNumber: number) => IStartupChecklistSummary;
}

export function useStartupChecklist(): IUseStartupChecklistResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [items, setItems] = React.useState<IStartupChecklistItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchChecklist = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getStartupChecklist(projectCode);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Checklist entity changes from other users
  useSignalR({
    entityType: EntityType.Checklist,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchChecklist(lastProjectCodeRef.current);
      }
    }, [fetchChecklist]),
  });

  // Helper to broadcast checklist changes
  const broadcastChecklistChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Checklist,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateItem = React.useCallback(async (projectCode: string, itemId: number, data: Partial<IStartupChecklistItem>) => {
    const updated = await dataService.updateChecklistItem(projectCode, itemId, data);
    setItems(prev => prev.map(i => i.id === itemId ? updated : i));
    broadcastChecklistChange(itemId, 'updated', 'Checklist item updated');
    return updated;
  }, [dataService, broadcastChecklistChange]);

  const addItem = React.useCallback(async (projectCode: string, item: Partial<IStartupChecklistItem>) => {
    const created = await dataService.addChecklistItem(projectCode, item);
    setItems(prev => [...prev, created]);
    broadcastChecklistChange(created.id, 'created', 'Checklist item added');
    return created;
  }, [dataService, broadcastChecklistChange]);

  const removeItem = React.useCallback(async (projectCode: string, itemId: number) => {
    await dataService.removeChecklistItem(projectCode, itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    broadcastChecklistChange(itemId, 'deleted', 'Checklist item removed');
  }, [dataService, broadcastChecklistChange]);

  const computeSummary = React.useCallback((subset: IStartupChecklistItem[]): IStartupChecklistSummary => {
    return {
      total: subset.length,
      conforming: subset.filter(i => i.status === 'Conforming').length,
      deficient: subset.filter(i => i.status === 'Deficient').length,
      na: subset.filter(i => i.status === 'NA').length,
      neutral: subset.filter(i => i.status === 'Neutral').length,
      noResponse: subset.filter(i => i.status === 'NoResponse').length,
    };
  }, []);

  const getSummary = React.useCallback(() => computeSummary(items), [items, computeSummary]);

  const getSectionSummary = React.useCallback((sectionNumber: number) => {
    return computeSummary(items.filter(i => i.sectionNumber === sectionNumber));
  }, [items, computeSummary]);

  return { items, isLoading, error, fetchChecklist, updateItem, addItem, removeItem, getSummary, getSectionSummary };
}
